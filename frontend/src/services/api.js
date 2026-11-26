import axios from "axios";
import {
  loadMockState,
  saveMockState,
  recordFailedLogin,
  isEmailLockedOut,
  clearFailedLogins,
  createMockToken,
  getUserFromToken,
  getHydratedHistory,
  computeDashboardForUser,
  computeRecoveryPlanForUser,
  advanceRecoveryModeForUser,
  evaluateMockPythonSubmission,
  getMockTaxonomy,
  getFullQuestionById,
  getQuestionDetailById,
  listQuestionsSummary,
  adminGetTopics,
  adminGetSubtopics,
  adminCreateSubtopic,
  adminUpdateSubtopic,
  adminDeleteSubtopic,
  adminListQuestions,
  adminGetQuestionById,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminRestoreQuestion,
  adminListUsers,
  adminUpdateUserRole,
  adminUpdateUserActive,
  adminDeleteUser,
  switchMockUserRole,
} from "../data/mockDatabase";
import {
  buildModeTransitionInfo,
  computePlanProgress,
} from "../utils/diagnostics";

// Toggle to `false` to communicate directly with the Express + MongoDB backend at VITE_API_URL
export const USE_MOCK_DATA = false;

export const TOKEN_STORAGE_KEY = "iv_auth_token";
export const USER_STORAGE_KEY = "iv_auth_user";
export const AUTH_EXPIRED_EVENT = "iv:auth-expired";
export const ATTEMPT_RECORDED_EVENT = "iv:attempt-recorded";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor: automatically attach JWT Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Extracts a human-readable message from Axios/backend errors, supporting both
 * `{ message }` and `{ error }` response payloads across 400/401/403/409/429/500.
 */
export function getApiErrorMessage(
  error,
  fallback = "An unexpected error occurred.",
) {
  if (!error) return fallback;
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (typeof data?.message === "string" && data.message.trim())
    return data.message.trim();
  if (typeof data?.error === "string" && data.error.trim())
    return data.error.trim();
  if (
    typeof error?.message === "string" &&
    error.message.trim() &&
    !error.isAxiosError
  ) {
    return error.message.trim();
  }
  return fallback;
}

// Response interceptor: handle 401 token expiration on protected endpoints without reload loops
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const isAuthAttempt =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

function createMockAxiosError(status, message, url = "") {
  const err = new Error(message);
  err.isAxiosError = true;
  err.config = { url };
  err.response = {
    status,
    data: { message },
  };
  return err;
}

function handleMockUnauthorized(url) {
  const isAuthAttempt =
    url.includes("/auth/login") || url.includes("/auth/register");
  if (!isAuthAttempt) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
  return createMockAxiosError(
    401,
    "Session expired. Please sign in again.",
    url,
  );
}

function delay(ms = 140) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireMockAuth(url) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const user = getUserFromToken(token);
  if (!user || user.isActive === false) {
    throw handleMockUnauthorized(url);
  }
  return user;
}

function requireMockAdmin(url) {
  const user = requireMockAuth(url);
  if (user.role !== "Admin") {
    throw createMockAxiosError(
      403,
      "Access denied: Admin privileges required",
      url,
    );
  }
  return user;
}

function runMockAdmin(url, fn) {
  const admin = requireMockAdmin(url);
  try {
    return fn(admin);
  } catch (err) {
    throw createMockAxiosError(
      err?.status || 500,
      err?.message || "Admin request failed.",
      url,
    );
  }
}

export const authAPI = {
  async register({ name, email, password }) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.post("/auth/register", {
        name,
        email,
        password,
      });
      return data;
    }

    await delay(180);
    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || password.length < 8) {
      throw createMockAxiosError(
        400,
        "Name, valid email, and password (minimum 8 characters) are required.",
        "/auth/register",
      );
    }

    const state = loadMockState();
    const existing = state.users.find(
      (u) => u.email.toLowerCase() === trimmedEmail,
    );
    if (existing) {
      throw createMockAxiosError(
        400,
        "An account with this email already exists.",
        "/auth/register",
      );
    }

    const newUser = {
      _id: `usr_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: "Student",
      isActive: true,
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
    };

    state.users.push(newUser);
    state.attemptsByUser[newUser._id] = [];
    state.completedPlanQuestionsByUser[newUser._id] = [];
    state.activeModeByUser = state.activeModeByUser || {};
    state.modeCycleByUser = state.modeCycleByUser || {};
    state.activeModeByUser[newUser._id] = "Onboarding";
    state.modeCycleByUser[newUser._id] = 0;
    saveMockState(state);

    const token = createMockToken(newUser._id);
    return {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token,
    };
  },

  async login({ email, password }) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.post("/auth/login", { email, password });
      return data;
    }

    await delay(180);
    const trimmedEmail = (email || "").trim().toLowerCase();

    if (isEmailLockedOut(trimmedEmail)) {
      throw createMockAxiosError(
        429,
        "Too many failed sign-in attempts. Account temporarily locked for 10 minutes.",
        "/auth/login",
      );
    }

    const state = loadMockState();
    const user = state.users.find(
      (u) => u.email.toLowerCase() === trimmedEmail,
    );

    if (!user || user.password !== password) {
      const attempts = recordFailedLogin(trimmedEmail);
      if (attempts >= 5) {
        throw createMockAxiosError(
          429,
          "Too many failed sign-in attempts. Account temporarily locked for 10 minutes.",
          "/auth/login",
        );
      }
      throw createMockAxiosError(
        401,
        "Invalid email or password. Please verify your credentials.",
        "/auth/login",
      );
    }

    if (user.isActive === false) {
      throw createMockAxiosError(
        403,
        "This account has been disabled by an administrator.",
        "/auth/login",
      );
    }

    clearFailedLogins(trimmedEmail);
    const token = createMockToken(user._id);
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    };
  },

  async getProfile() {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get("/auth/profile");
      return data;
    }

    await delay(90);
    const user = requireMockAuth("/auth/profile");
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
};

export const questionsAPI = {
  async getTaxonomy() {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get("/questions/taxonomy");
      return data;
    }

    await delay(100);
    requireMockAuth("/questions/taxonomy");
    return getMockTaxonomy();
  },

  async getQuestions(params = {}, options = {}) {
    if (!USE_MOCK_DATA) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      );
      const { data } = await apiClient.get("/questions", {
        params: cleanParams,
        signal: options?.signal,
      });
      return data;
    }

    await delay(120);
    requireMockAuth("/questions");
    let list = listQuestionsSummary();

    if (params.topicID) {
      list = list.filter((q) => q.topicID._id === params.topicID);
    }
    if (params.subtopicID) {
      list = list.filter((q) =>
        q.subtopicIDs.some((s) => s._id === params.subtopicID),
      );
    }
    if (params.difficulty) {
      list = list.filter((q) => q.difficulty === params.difficulty);
    }
    if (params.type) {
      list = list.filter((q) => q.type === params.type);
    }
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.statement.toLowerCase().includes(term) ||
          q.topicID.name.toLowerCase().includes(term) ||
          q.subtopicIDs.some((s) => s.name.toLowerCase().includes(term)),
      );
    }

    return list;
  },

  async getQuestionById(id) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get(`/questions/${id}`);
      return data;
    }

    await delay(110);
    requireMockAuth(`/questions/${id}`);
    const found = getQuestionDetailById(id);
    if (!found) {
      throw createMockAxiosError(
        404,
        "Question not found.",
        `/questions/${id}`,
      );
    }
    return found;
  },
};

export const attemptsAPI = {
  async submitAttempt({
    questionID,
    submittedCodeOrText,
    timeTakenSeconds,
    status,
  }) {
    const safeText =
      typeof submittedCodeOrText === "string" ? submittedCodeOrText : "";
    const safeSeconds = Math.max(0, Math.round(Number(timeTakenSeconds) || 0));

    if (status !== "Skipped" && !safeText.trim()) {
      throw createMockAxiosError(
        400,
        "Submission cannot be empty unless marking the question as Skipped.",
        "/attempts",
      );
    }

    if (!USE_MOCK_DATA) {
      // Strictly send ONLY { questionID, submittedCodeOrText, timeTakenSeconds, status }
      const { data } = await apiClient.post("/attempts", {
        questionID,
        submittedCodeOrText: safeText,
        timeTakenSeconds: safeSeconds,
        status,
      });
      window.dispatchEvent(new CustomEvent(ATTEMPT_RECORDED_EVENT));
      return data;
    }

    await delay(240);
    const user = requireMockAuth("/attempts");
    const question = getFullQuestionById(questionID);
    if (!question) {
      throw createMockAxiosError(404, "Question not found.", "/attempts");
    }

    let finalStatus = status;
    let message = "Attempt recorded successfully.";
    let testDetails = [];
    let stdout = "";

    if (status === "Skipped") {
      finalStatus = "Skipped";
      message = "Question marked as skipped.";
    } else if (question.type === "Coding") {
      const evaluation = evaluateMockPythonSubmission(question, safeText);
      finalStatus = evaluation.status;
      message = evaluation.message;
      testDetails = evaluation.testDetails;
      stdout = evaluation.stdout || "";
    } else {
      finalStatus = status === "Solved" ? "Solved" : "Attempted";
      message =
        finalStatus === "Solved"
          ? "Self-assessment saved: marked as Solved."
          : "Self-assessment saved: flagged for additional practice.";
    }

    const state = loadMockState();
    const userAttempts = state.attemptsByUser[user._id] || [];
    userAttempts.unshift({
      _id: `att_${Date.now()}`,
      questionID: question._id,
      status: finalStatus,
      timeTakenSeconds: safeSeconds,
      createdAt: new Date().toISOString(),
    });
    state.attemptsByUser[user._id] = userAttempts;

    const completedList = state.completedPlanQuestionsByUser[user._id] || [];
    if (finalStatus === "Solved" && !completedList.includes(question._id)) {
      completedList.push(question._id);
      state.completedPlanQuestionsByUser[user._id] = completedList;
    }
    saveMockState(state);
    window.dispatchEvent(new CustomEvent(ATTEMPT_RECORDED_EVENT));

    return {
      message,
      status: finalStatus,
      testDetails,
      stdout,
    };
  },

  // Run: evaluates the code against the test cases WITHOUT recording an attempt.
  async runCode({ questionID, submittedCodeOrText }) {
    const safeText =
      typeof submittedCodeOrText === "string" ? submittedCodeOrText : "";

    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.post("/attempts/run", {
        questionID,
        submittedCodeOrText: safeText,
      });
      return data;
    }

    await delay(240);
    requireMockAuth("/attempts/run");
    const question = getFullQuestionById(questionID);
    if (!question) {
      throw createMockAxiosError(404, "Question not found.", "/attempts/run");
    }
    const evaluation = evaluateMockPythonSubmission(question, safeText);
    return {
      message: evaluation.message,
      status: evaluation.status,
      testDetails: evaluation.testDetails,
      stdout: evaluation.stdout || "",
    };
  },

  async getDashboard() {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get("/attempts/dashboard");
      return data;
    }

    await delay(140);
    const user = requireMockAuth("/attempts/dashboard");
    return computeDashboardForUser(user._id);
  },

  async getHistory() {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get("/attempts/history");
      return data;
    }

    await delay(130);
    const user = requireMockAuth("/attempts/history");
    return getHydratedHistory(user._id);
  },
};

const ackTransitionKey = (plan) =>
  plan?._id ? `iv_mode_ack_${plan._id}_${plan.mode || ""}` : null;

export const recoveryPlanAPI = {
  async getRecoveryPlan() {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get("/recovery-plan");
      const plan = data?.plan || null;
      const progress = computePlanProgress(plan);
      const ackKey = ackTransitionKey(plan);
      const alreadyAcked = ackKey
        ? sessionStorage.getItem(ackKey) === "1"
        : false;

      if (
        plan &&
        progress.total >= 5 &&
        progress.completed === progress.total &&
        !alreadyAcked
      ) {
        let subtopicStats = [];
        try {
          const dashboard = await attemptsAPI.getDashboard();
          subtopicStats = Array.isArray(dashboard?.subtopicStats)
            ? dashboard.subtopicStats
            : [];
        } catch {
          subtopicStats = [];
        }
        return {
          ...data,
          pendingTransition: buildModeTransitionInfo(
            plan.mode || "Onboarding",
            subtopicStats,
          ),
        };
      }
      return { ...data, pendingTransition: null };
    }

    await delay(140);
    const user = requireMockAuth("/recovery-plan");
    return computeRecoveryPlanForUser(user._id);
  },

  async advanceRecoveryMode(currentPlan) {
    if (!USE_MOCK_DATA) {
      const ackKey = ackTransitionKey(currentPlan);
      if (ackKey) {
        try {
          sessionStorage.setItem(ackKey, "1");
        } catch {
          // ignore storage failure
        }
      }
      const { data } = await apiClient.get("/recovery-plan");
      return { ...data, pendingTransition: null };
    }

    await delay(160);
    const user = requireMockAuth("/recovery-plan");
    return advanceRecoveryModeForUser(user._id);
  },
};

export const adminAPI = {
  async getTopics() {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get("/admin/topics");
      return data;
    }
    await delay(90);
    return runMockAdmin("/admin/topics", () => adminGetTopics());
  },

  async getSubtopics(topicID = "") {
    if (!USE_MOCK_DATA) {
      const params = topicID ? { topicID } : undefined;
      const { data } = await apiClient.get("/admin/subtopics", { params });
      return data;
    }
    await delay(100);
    return runMockAdmin("/admin/subtopics", () => adminGetSubtopics(topicID));
  },

  async createSubtopic({ topicID, name }) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.post("/admin/subtopics", {
        topicID,
        name,
      });
      return data;
    }
    await delay(130);
    return runMockAdmin("/admin/subtopics", () =>
      adminCreateSubtopic({ topicID, name }),
    );
  },

  async updateSubtopic(id, { name }) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.put(`/admin/subtopics/${id}`, { name });
      return data;
    }
    await delay(130);
    return runMockAdmin(`/admin/subtopics/${id}`, () =>
      adminUpdateSubtopic(id, { name }),
    );
  },

  async deleteSubtopic(id) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.delete(`/admin/subtopics/${id}`);
      return data;
    }
    await delay(140);
    return runMockAdmin(`/admin/subtopics/${id}`, () =>
      adminDeleteSubtopic(id),
    );
  },

  async getQuestions(params = {}, options = {}) {
    if (!USE_MOCK_DATA) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      );
      const { data } = await apiClient.get("/admin/questions", {
        params: cleanParams,
        signal: options?.signal,
      });
      return data;
    }
    await delay(120);
    return runMockAdmin("/admin/questions", () => adminListQuestions(params));
  },

  async getQuestionById(id) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get(`/admin/questions/${id}`);
      return data;
    }
    await delay(100);
    return runMockAdmin(`/admin/questions/${id}`, () =>
      adminGetQuestionById(id),
    );
  },

  async createQuestion(payload) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.post("/admin/questions", payload);
      return data;
    }
    await delay(160);
    return runMockAdmin("/admin/questions", () => adminCreateQuestion(payload));
  },

  async updateQuestion(id, payload) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.put(`/admin/questions/${id}`, payload);
      return data;
    }
    await delay(160);
    return runMockAdmin(`/admin/questions/${id}`, () =>
      adminUpdateQuestion(id, payload),
    );
  },

  async deleteQuestion(id) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.delete(`/admin/questions/${id}`);
      return data;
    }
    await delay(150);
    return runMockAdmin(`/admin/questions/${id}`, () =>
      adminDeleteQuestion(id),
    );
  },

  async restoreQuestion(id) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.post(`/admin/questions/${id}/restore`);
      return data;
    }
    await delay(140);
    return runMockAdmin(`/admin/questions/${id}/restore`, () =>
      adminRestoreQuestion(id),
    );
  },

  async getUsers() {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.get("/admin/users");
      return data;
    }
    await delay(110);
    return runMockAdmin("/admin/users", () => adminListUsers());
  },

  async updateUserRole(id, role) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.put(`/admin/users/${id}/role`, { role });
      return data;
    }
    await delay(140);
    return runMockAdmin(`/admin/users/${id}/role`, (admin) =>
      adminUpdateUserRole(id, role, admin._id),
    );
  },

  async updateUserActive(id, isActive) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.put(`/admin/users/${id}/active`, {
        isActive,
      });
      return data;
    }
    await delay(140);
    return runMockAdmin(`/admin/users/${id}/active`, (admin) =>
      adminUpdateUserActive(id, isActive, admin._id),
    );
  },

  async deleteUser(id) {
    if (!USE_MOCK_DATA) {
      const { data } = await apiClient.delete(`/admin/users/${id}`);
      return data;
    }
    await delay(150);
    return runMockAdmin(`/admin/users/${id}`, (admin) =>
      adminDeleteUser(id, admin._id),
    );
  },
};

export async function switchMockRole() {
  if (!USE_MOCK_DATA) return null;
  await delay(80);
  const user = requireMockAuth("/auth/profile");
  return switchMockUserRole(user._id);
}

export default apiClient;

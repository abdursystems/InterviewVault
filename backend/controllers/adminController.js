const mongoose = require("mongoose");
const User = require("../models/User.js");
const Topic = require("../models/Topic.js");
const Subtopic = require("../models/Subtopic.js");
const Question = require("../models/Question.js");
const Attempt = require("../models/Attempt.js");
const RecoveryPlan = require("../models/RecoveryPlan.js");
const UserSubtopicStats = require("../models/UserSubtopicStats.js");

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TYPES = ["Theory", "Coding"];
const ROLES = ["Student", "Admin"];
const MAX_TAGS = 3; // FR-5: every question carries 1 to 3 subtopic tags

const isId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sameIds = (a, b) =>
  a.length === b.length && a.every((id) => b.includes(id));

// Wraps a handler so every error is answered as JSON.
// Express 5 leaves req.body undefined when no JSON body was sent, so the
// handlers read it through `body`, never req.body directly.
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res, req.body || {});
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "This record already exists" });
    }
    const payload = { message: "Server Error Occurred" };
    if (process.env.NODE_ENV !== "production") {
      payload.error = error.message;
    }
    res.status(500).json(payload);
  }
};

// ---------------------------------------------------------------- topics

// @route  GET /api/admin/topics
const listTopics = async (req, res) => {
  const topics = await Topic.find().sort({ name: 1 });
  res.json(topics);
};

// ------------------------------------------------------------- subtopics

// @route  GET /api/admin/subtopics?topicID=
const listSubtopics = async (req, res) => {
  const filter = {};
  if (isId(req.query.topicID)) filter.topicID = req.query.topicID;

  const subtopics = await Subtopic.find(filter)
    .populate("topicID", "name")
    .sort({ name: 1 });
  res.json(subtopics);
};

// @route  POST /api/admin/subtopics   body: { topicID, name }
const createSubtopic = async (req, res, body) => {
  const name = String(body.name || "").trim();
  const { topicID } = body;

  if (!name) {
    return res.status(400).json({ message: "Subtopic name is required" });
  }
  if (!isId(topicID) || !(await Topic.exists({ _id: topicID }))) {
    return res.status(400).json({ message: "Topic not found" });
  }

  const duplicate = await Subtopic.findOne({
    topicID,
    name: new RegExp(`^${escapeRegex(name)}$`, "i"),
  });
  if (duplicate) {
    return res
      .status(409)
      .json({ message: "Subtopic already exists in this topic" });
  }

  const subtopic = await Subtopic.create({ topicID, name });
  res.status(201).json(subtopic);
};

// @route  PUT /api/admin/subtopics/:id   body: { name }
const updateSubtopic = async (req, res, body) => {
  const { id } = req.params;
  const name = String(body.name || "").trim();

  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });
  if (!name) {
    return res.status(400).json({ message: "Subtopic name is required" });
  }

  const subtopic = await Subtopic.findById(id);
  if (!subtopic) return res.status(404).json({ message: "Subtopic not found" });

  const duplicate = await Subtopic.findOne({
    _id: { $ne: id },
    topicID: subtopic.topicID,
    name: new RegExp(`^${escapeRegex(name)}$`, "i"),
  });
  if (duplicate) {
    return res
      .status(409)
      .json({ message: "Subtopic already exists in this topic" });
  }

  subtopic.name = name;
  await subtopic.save();
  res.json(subtopic);
};

// @route  DELETE /api/admin/subtopics/:id
const deleteSubtopic = async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });

  const subtopic = await Subtopic.findById(id);
  if (!subtopic) return res.status(404).json({ message: "Subtopic not found" });

  const used = await Question.countDocuments({ subtopicIDs: id });
  if (used > 0) {
    return res.status(409).json({
      message: `Cannot delete: ${used} question(s) use this subtopic`,
    });
  }

  await subtopic.deleteOne();
  // no question carries this tag any more, so its per-user counters are orphaned
  await UserSubtopicStats.deleteMany({ subtopicID: id });
  res.json({ deleted: true });
};

// ------------------------------------------------------------- questions

// Checks a question payload (FR-5, FR-11) and returns { error } or { data }
const validateQuestion = async (body) => {
  const statement = String(body.statement || "").trim();
  const { topicID, difficulty, type } = body;

  if (!statement) return { error: "Statement is required" };
  if (!DIFFICULTIES.includes(difficulty)) {
    return { error: "Difficulty must be Easy, Medium or Hard" };
  }
  if (!TYPES.includes(type)) return { error: "Type must be Theory or Coding" };
  if (!isId(topicID) || !(await Topic.exists({ _id: topicID }))) {
    return { error: "Topic not found" };
  }

  const subtopicIDs = Array.isArray(body.subtopicIDs)
    ? [...new Set(body.subtopicIDs.map(String))]
    : [];
  if (subtopicIDs.length < 1 || subtopicIDs.length > MAX_TAGS) {
    return { error: "A question needs 1 to 3 subtopic tags" };
  }
  if (!subtopicIDs.every(isId)) return { error: "Invalid subtopic ID" };

  const found = await Subtopic.countDocuments({
    _id: { $in: subtopicIDs },
    topicID,
  });
  if (found !== subtopicIDs.length) {
    return {
      error: "Every subtopic must exist and belong to the selected topic",
    };
  }

  const modelAnswer = String(body.modelAnswer || "").trim();
  const data = {
    statement,
    topicID,
    subtopicIDs,
    difficulty,
    type,
    // Always set explicitly so switching Theory -> Coding clears stale modelAnswer
    modelAnswer: modelAnswer || undefined,
    testCases: [],
  };

  if (type === "Theory") {
    if (!modelAnswer) return { error: "Theory questions need a model answer" };
  } else {
    if (!Array.isArray(body.testCases) || body.testCases.length === 0) {
      return { error: "Coding questions need at least one test case" };
    }
    const testCases = [];
    for (const tc of body.testCases) {
      if (!tc || typeof tc !== "object") return { error: "Invalid test case" };
      const expectedOutput = String(tc.expectedOutput ?? "").trim();
      if (!expectedOutput) {
        return { error: "Every test case needs an expected output" };
      }
      testCases.push({
        input: String(tc.input ?? ""),
        expectedOutput,
        isHidden: Boolean(tc.isHidden),
      });
    }
    data.testCases = testCases;
  }

  return { data };
};

// @route  GET /api/admin/questions?topicID=&subtopicID=&difficulty=&type=&archived=&q=&page=&limit=
const listQuestions = async (req, res) => {
  const { topicID, subtopicID, difficulty, type, archived, q } = req.query;
  const filter = {};

  if (isId(topicID)) filter.topicID = topicID;
  if (isId(subtopicID)) filter.subtopicIDs = subtopicID;
  if (DIFFICULTIES.includes(difficulty)) filter.difficulty = difficulty;
  if (TYPES.includes(type)) filter.type = type;
  if (q) filter.statement = new RegExp(escapeRegex(String(q)), "i");
  if (archived === "true") filter.isArchived = true;
  if (archived === "false") filter.isArchived = { $ne: true };

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Question.find(filter)
      .populate("topicID", "name")
      .populate("subtopicIDs", "name")
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Question.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
};

// @route  GET /api/admin/questions/:id   (includes hidden test cases)
const getQuestion = async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });

  const question = await Question.findById(id)
    .populate("topicID", "name")
    .populate("subtopicIDs", "name");
  if (!question) return res.status(404).json({ message: "Question not found" });

  res.json(question);
};

// @route  POST /api/admin/questions
const createQuestion = async (req, res, body) => {
  const { error, data } = await validateQuestion(body);
  if (error) return res.status(400).json({ message: error });

  const question = await Question.create(data);
  res.status(201).json(question);
};

// @route  PUT /api/admin/questions/:id
const updateQuestion = async (req, res, body) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });

  const existing = await Question.findById(id);
  if (!existing) return res.status(404).json({ message: "Question not found" });

  const { error, data } = await validateQuestion(body);
  if (error) return res.status(400).json({ message: error });

  // UserSubtopicStats are counters built from past attempts. Re-tagging a
  // question that already has attempts would leave those counters wrong.
  const tagsChanged = !sameIds(
    data.subtopicIDs,
    existing.subtopicIDs.map(String),
  );
  if (tagsChanged && (await Attempt.exists({ questionID: id }))) {
    return res.status(409).json({
      message:
        "This question already has attempts, so its subtopic tags cannot change. Archive it and create a new question instead.",
    });
  }

  Object.assign(existing, data);
  await existing.save();
  res.json(existing);
};

// @route  DELETE /api/admin/questions/:id
// FR-11: a question that students have attempted (or that sits in a recovery
// plan) is archived, not deleted
const deleteQuestion = async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });

  const question = await Question.findById(id);
  if (!question) return res.status(404).json({ message: "Question not found" });

  const inUse =
    (await Attempt.exists({ questionID: id })) ||
    (await RecoveryPlan.exists({ "items.questionID": id }));

  if (inUse) {
    question.isArchived = true;
    await question.save();
    return res.json({
      archived: true,
      message: "Question is in use, so it was archived instead of deleted",
    });
  }

  await question.deleteOne();
  res.json({ deleted: true });
};

// @route  POST /api/admin/questions/:id/restore
const restoreQuestion = async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });

  const question = await Question.findById(id);
  if (!question) return res.status(404).json({ message: "Question not found" });

  question.isArchived = false;
  await question.save();
  res.json(question);
};

// ----------------------------------------------------------------- users

// @route  GET /api/admin/users
const listUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
};

// @route  PUT /api/admin/users/:id/role   body: { role }
const updateUserRole = async (req, res, body) => {
  const { id } = req.params;
  const { role } = body;

  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: "Role must be Student or Admin" });
  }
  if (String(id) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { returnDocument: "after" },
  ).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};

// @route  PUT /api/admin/users/:id/active   body: { isActive: true | false }
const setUserActive = async (req, res, body) => {
  const { id } = req.params;
  const { isActive } = body;

  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be true or false" });
  }
  if (String(id) === String(req.user._id)) {
    return res
      .status(400)
      .json({ message: "You cannot disable your own account" });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { returnDocument: "after" },
  ).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};

// @route  DELETE /api/admin/users/:id
// Attempts are never deleted, so a user who has attempts can only be disabled
const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: "Invalid ID" });
  if (String(id) === String(req.user._id)) {
    return res
      .status(400)
      .json({ message: "You cannot delete your own account" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (await Attempt.exists({ userID: id })) {
    return res.status(409).json({
      message:
        "This user has attempts. Disable the account instead of deleting it.",
    });
  }

  await user.deleteOne();
  // derived data that belongs only to this user
  await RecoveryPlan.deleteMany({ userID: id });
  await UserSubtopicStats.deleteMany({ userID: id });
  res.json({ deleted: true });
};

module.exports = {
  listTopics: wrap(listTopics),
  listSubtopics: wrap(listSubtopics),
  createSubtopic: wrap(createSubtopic),
  updateSubtopic: wrap(updateSubtopic),
  deleteSubtopic: wrap(deleteSubtopic),
  listQuestions: wrap(listQuestions),
  getQuestion: wrap(getQuestion),
  createQuestion: wrap(createQuestion),
  updateQuestion: wrap(updateQuestion),
  deleteQuestion: wrap(deleteQuestion),
  restoreQuestion: wrap(restoreQuestion),
  listUsers: wrap(listUsers),
  updateUserRole: wrap(updateUserRole),
  setUserActive: wrap(setUserActive),
  deleteUser: wrap(deleteUser),
};

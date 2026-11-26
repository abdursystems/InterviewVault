export interface TopicRef {
  _id: string;
  name: string;
}

export interface SubtopicRef {
  _id: string;
  name: string;
  topicID?: string | TopicRef;
}

/**
 * Safely normalizes a topic reference that may be either a populated object `{ _id, name }`
 * or a raw string ID.
 */
export function extractTopicId(topicRef: string | TopicRef | null | undefined): string {
  if (!topicRef) return '';
  if (typeof topicRef === 'string') return topicRef;
  return typeof topicRef._id === 'string' ? topicRef._id : '';
}

/**
 * Safely parses a percentage/accuracy value to a finite integer between 0 and 100.
 */
export function normalizeAccuracy(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export interface QuestionSummary {
  _id: string;
  statement: string;
  topicID: TopicRef;
  subtopicIDs: SubtopicRef[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'Theory' | 'Coding';
}

export interface AttemptRecord {
  _id: string;
  questionID: QuestionSummary;
  status: 'Solved' | 'Attempted' | 'Skipped';
  timeTakenSeconds: number;
  createdAt: string;
}

export interface SubtopicStat {
  subtopicID: string;
  subtopicName: string;
  topicName: string;
  solved: number;
  attempted: number;
  skipped: number;
  accuracy: number;
  lastPracticed: string | null;
}

export interface RecoveryPlanItem {
  questionID: QuestionSummary;
  role: 'Focus' | 'Retry' | 'Review' | 'Stretch';
  reason: string;
  state: 'Pending' | 'Completed';
}

export interface RecoveryPlan {
  _id: string;
  date: string;
  mode: 'RootCause' | 'GeneralPractice' | 'Onboarding';
  diagnosedSubtopicID: { _id: string; name: string } | null;
  items: RecoveryPlanItem[];
}

export interface QuestionFilters {
  search: string;
  topicID: string;
  subtopicID: string;
  difficulty: string;
  type: string;
  status: string;
}

export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDurationHuman(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  if (safe < 60) return `${safe}s`;
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

export function formatShortDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Never';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimestamp(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Cross-references attempt history and returns the latest user status per questionID.
 */
export function buildLatestStatusMap(
  history: AttemptRecord[] | null | undefined
): Record<string, 'Solved' | 'Attempted' | 'Skipped'> {
  if (!Array.isArray(history) || history.length === 0) {
    return {};
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const map: Record<string, 'Solved' | 'Attempted' | 'Skipped'> = {};
  for (const attempt of sorted) {
    const qId = attempt?.questionID?._id;
    if (qId && !map[qId]) {
      map[qId] = attempt.status;
    }
  }
  return map;
}

/**
 * Applies client-side filtering (including status cross-reference) over questions.
 */
export function filterQuestions(
  questions: QuestionSummary[],
  filters: Partial<QuestionFilters>,
  statusMap: Record<string, 'Solved' | 'Attempted' | 'Skipped'> = {}
): QuestionSummary[] {
  if (!Array.isArray(questions)) return [];

  const searchLower = (filters.search || '').trim().toLowerCase();

  return questions.filter((q) => {
    if (!q) return false;
    if (filters.topicID && extractTopicId(q.topicID) !== filters.topicID) {
      return false;
    }
    if (
      filters.subtopicID &&
      !q.subtopicIDs?.some((sub) => sub?._id === filters.subtopicID)
    ) {
      return false;
    }
    if (filters.difficulty && q.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.type && q.type !== filters.type) {
      return false;
    }
    if (filters.status) {
      const latestStatus = statusMap[q._id] || 'Unattempted';
      if (latestStatus !== filters.status) {
        return false;
      }
    }
    if (searchLower) {
      const statementMatch = (q.statement || '').toLowerCase().includes(searchLower);
      const topicMatch = (q.topicID?.name || '').toLowerCase().includes(searchLower);
      const subtopicMatch = q.subtopicIDs?.some((s) =>
        (s?.name || '').toLowerCase().includes(searchLower)
      );
      if (!statementMatch && !topicMatch && !subtopicMatch) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Sorts subtopics from lowest accuracy to highest, breaking ties by oldest practice date.
 */
export function sortSubtopicsByWeakness(stats: SubtopicStat[] | null | undefined): SubtopicStat[] {
  if (!Array.isArray(stats)) return [];
  return [...stats]
    .filter(Boolean)
    .map((s) => ({
      ...s,
      solved: Number(s.solved) || 0,
      attempted: Number(s.attempted) || 0,
      skipped: Number(s.skipped) || 0,
      accuracy: normalizeAccuracy(s.accuracy),
    }))
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) {
        return a.accuracy - b.accuracy;
      }
      const timeA = a.lastPracticed ? new Date(a.lastPracticed).getTime() || 0 : 0;
      const timeB = b.lastPracticed ? new Date(b.lastPracticed).getTime() || 0 : 0;
      return timeA - timeB;
    });
}

/**
 * Computes recovery plan completion counts safely even when plan or items are null/empty.
 */
export function computePlanProgress(plan: RecoveryPlan | null | undefined): {
  completed: number;
  total: number;
  percent: number;
} {
  const items = Array.isArray(plan?.items) ? plan.items : [];
  const total = items.length;
  const completed = items.filter((item) => item?.state === 'Completed').length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

/**
 * Validates login / registration form fields.
 */
export function validateAuthForm(
  mode: 'login' | 'register',
  values: { name?: string; email: string; password: string; confirmPassword?: string }
): Record<string, string> {
  const errors: Record<string, string> = {};
  const email = (values.email || '').trim();
  const password = values.password || '';
  const confirmPassword = values.confirmPassword || '';
  const name = (values.name || '').trim();

  if (mode === 'register') {
    if (!name) {
      errors.name = 'Full name is required.';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (mode === 'register') {
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
  }

  return errors;
}

/**
 * Extracts a concise single-line title from a full question statement.
 */
export function extractQuestionHeadline(statement: string | null | undefined): string {
  if (!statement) return 'Untitled Question';
  const firstLine = statement.split('\n')[0].trim();
  return firstLine.replace(/^#+\s*/, '');
}

/**
 * Generates a clean Python starter template based on the question statement.
 */
export function getPythonStarterTemplate(statement: string | null | undefined): string {
  const headline = extractQuestionHeadline(statement);
  const sigMatch = statement?.match(/`?(def\s+[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)[^`\n]*)`?/);
  if (sigMatch && sigMatch[1]) {
    const rawSig = sigMatch[1].trim().replace(/:$/, '');
    return `# ${headline}\n\n${rawSig}:\n    # Write your Python solution here\n    pass\n`;
  }
  return `# ${headline}\n\ndef solve(data):\n    # Write your Python solution here\n    pass\n`;
}

export interface TestCaseDetail {
  passed?: boolean;
  actual?: string;
  expected?: string;
  error?: string | null;
}

export interface ExecutionResultLike {
  status?: string;
  message?: string;
  stdout?: string;
  output?: string;
  stderr?: string;
  error?: string;
  testDetails?: TestCaseDetail[];
}

export interface ExecutionConsoleSummary {
  hasError: boolean;
  errorMessage: string;
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  statusLabel: 'Passed' | 'Failed';
  printedOutput: string;
  hasPrintedOutput: boolean;
}

function stripPythonInlineComment(line: string): string {
  let quote: string | null = null;
  let escaped = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === '#') {
      return line.slice(0, i);
    }
  }
  return line;
}

function splitTopLevelArgs(argStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (let i = 0; i < argStr.length; i += 1) {
    const ch = argStr[i];
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (quote) {
      current += ch;
      if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      depth += 1;
      current += ch;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === ',' && depth === 0) {
      if (current.trim().length > 0) {
        args.push(current.trim());
      }
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) {
    args.push(current.trim());
  }
  return args;
}

function unescapePythonString(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function evaluatePythonExpression(expr: string, env: Record<string, string>): string {
  const trimmed = expr.trim();
  if (!trimmed) return '';

  // f-string: f"..." or f'...'
  if (
    (trimmed.startsWith('f"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("f'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('F"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("F'") && trimmed.endsWith("'"))
  ) {
    const inner = unescapePythonString(trimmed.slice(2, -1));
    return inner.replace(/\{([^{}]+)\}/g, (_, innerExpr: string) =>
      evaluatePythonExpression(innerExpr, env)
    );
  }

  // Quoted string literal
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return unescapePythonString(trimmed.slice(1, -1));
  }

  // Known variable lookup
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    if (Object.prototype.hasOwnProperty.call(env, trimmed)) {
      return env[trimmed];
    }
    return trimmed;
  }

  // len(var_or_literal)
  const lenMatch = trimmed.match(/^len\((.+)\)$/);
  if (lenMatch) {
    const target = lenMatch[1].trim();
    const resolved = evaluatePythonExpression(target, env);
    if (resolved.startsWith('[') && resolved.endsWith(']')) {
      const inner = resolved.slice(1, -1).trim();
      return String(inner ? splitTopLevelArgs(inner).length : 0);
    }
    return String(resolved.length);
  }

  // Simple numeric binary expression (e.g. a + b, 2 * 3, x - 1)
  const arithMatch = trimmed.match(/^([a-zA-Z0-9_.]+)\s*([+\-*/])\s*([a-zA-Z0-9_.]+)$/);
  if (arithMatch) {
    const leftVal = evaluatePythonExpression(arithMatch[1], env);
    const rightVal = evaluatePythonExpression(arithMatch[3], env);
    const leftNum = Number(leftVal);
    const rightNum = Number(rightVal);
    if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
      switch (arithMatch[2]) {
        case '+':
          return String(leftNum + rightNum);
        case '-':
          return String(leftNum - rightNum);
        case '*':
          return String(leftNum * rightNum);
        case '/':
          return rightNum !== 0 ? String(leftNum / rightNum) : trimmed;
      }
    }
    if (arithMatch[2] === '+') {
      return `${leftVal}${rightVal}`;
    }
  }

  return trimmed;
}

/**
 * Evaluates active (non-commented) Python print(...) calls for local preview mode.
 * Returns an empty string when code does not print anything (e.g. only uses return).
 */
export function extractMockPythonStdout(code: string | null | undefined): string {
  if (!code) return '';

  const env: Record<string, string> = {};
  const chunks: string[] = [];
  const lines = code.replace(/\r\n/g, '\n').split('\n');

  for (const rawLine of lines) {
    const cleanLine = stripPythonInlineComment(rawLine).trim();
    if (!cleanLine) continue;

    // Track simple variable assignments (e.g. x = 5, msg = "ok", items = [1, 2])
    const assignMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?!=)(.+)$/);
    if (assignMatch && !assignMatch[2].trim().startsWith('print(')) {
      env[assignMatch[1]] = evaluatePythonExpression(assignMatch[2], env);
    }

    // Scan for one or more print(...) calls on this line
    let cursor = 0;
    while (cursor < cleanLine.length) {
      const rest = cleanLine.slice(cursor);
      const match = rest.match(/(?:^|[^a-zA-Z0-9_.])print\s*\(/);
      if (!match || match.index === undefined) break;

      const openParenIndex = cursor + match.index + match[0].length - 1;
      let depth = 0;
      let quote: string | null = null;
      let escaped = false;
      let closeParenIndex = -1;

      for (let i = openParenIndex; i < cleanLine.length; i += 1) {
        const ch = cleanLine[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (quote) {
          if (ch === '\\') {
            escaped = true;
          } else if (ch === quote) {
            quote = null;
          }
          continue;
        }
        if (ch === "'" || ch === '"') {
          quote = ch;
        } else if (ch === '(') {
          depth += 1;
        } else if (ch === ')') {
          depth -= 1;
          if (depth === 0) {
            closeParenIndex = i;
            break;
          }
        }
      }

      if (closeParenIndex === -1) break;

      const argContent = cleanLine.slice(openParenIndex + 1, closeParenIndex);
      const parts = splitTopLevelArgs(argContent);
      let sep = ' ';
      let end = '\n';
      const positional: string[] = [];

      for (const part of parts) {
        const kwMatch = part.match(/^(sep|end)\s*=\s*(.+)$/);
        if (kwMatch) {
          const kwVal = evaluatePythonExpression(kwMatch[2], env);
          if (kwMatch[1] === 'sep') sep = kwVal;
          if (kwMatch[1] === 'end') end = kwVal;
        } else {
          positional.push(evaluatePythonExpression(part, env));
        }
      }

      chunks.push(positional.join(sep) + end);
      cursor = closeParenIndex + 1;
    }
  }

  return chunks.join('').replace(/\n$/, '');
}

/**
 * Derives clean console status, pass/fail counts, error state, and printed output
 * from either live backend or mock execution results.
 */
export function summarizeExecutionResult(
  executionResult: ExecutionResultLike | null | undefined
): ExecutionConsoleSummary {
  const details = Array.isArray(executionResult?.testDetails) ? executionResult.testDetails : [];
  const detailError = details.find((d) => Boolean(d?.error))?.error || '';
  const errorMessage = (
    detailError ||
    executionResult?.stderr ||
    executionResult?.error ||
    ''
  ).trim();
  const hasError = errorMessage.length > 0;

  const totalCount = details.length;
  const passedCount = details.filter((d) => Boolean(d?.passed)).length;
  const allPassed =
    !hasError && (totalCount > 0 ? passedCount === totalCount : executionResult?.status === 'Solved');

  const rawStdout =
    typeof executionResult?.stdout === 'string'
      ? executionResult.stdout
      : typeof executionResult?.output === 'string'
      ? executionResult.output
      : '';
  const printedOutput = rawStdout.replace(/\r\n/g, '\n').replace(/\n$/, '');

  return {
    hasError,
    errorMessage,
    passedCount,
    totalCount,
    allPassed,
    statusLabel: allPassed ? 'Passed' : 'Failed',
    printedOutput,
    hasPrintedOutput: !hasError && printedOutput.length > 0,
  };
}

export type PlanMode = 'Onboarding' | 'GeneralPractice' | 'RootCause';

export interface ModeTransitionInfo {
  fromMode: PlanMode;
  toMode: PlanMode;
  nextDiagnosedSubtopic: { _id: string; name: string } | null;
  reason: string;
}

export function getModeDisplayName(mode: PlanMode | string | null | undefined): string {
  switch (mode) {
    case 'Onboarding':
      return 'Initial Assessment';
    case 'GeneralPractice':
      return 'All-Round Practice';
    case 'RootCause':
      return 'Weak-Spot Fix';
    default:
      return mode || 'Diagnostic';
  }
}

/**
 * Determines the next recovery mode purely from subtopic accuracy stats:
 * - Any practiced subtopic below 70% accuracy -> RootCause (Weak-Spot Fix)
 * - All practiced subtopics at or above 70% -> GeneralPractice (All-Round Practice)
 */
export function determineNextPlanMode(subtopicStats: SubtopicStat[] | null | undefined): {
  toMode: PlanMode;
  nextDiagnosedSubtopic: { _id: string; name: string } | null;
  weakestAccuracy: number | null;
} {
  const sorted = sortSubtopicsByWeakness(subtopicStats);
  const weakest =
    sorted.find((s) => s.accuracy < 70 && s.solved + s.attempted >= 2) ||
    sorted.find((s) => s.accuracy < 70 && s.solved + s.attempted > 0) ||
    null;

  if (weakest) {
    return {
      toMode: 'RootCause',
      nextDiagnosedSubtopic: { _id: weakest.subtopicID, name: weakest.subtopicName },
      weakestAccuracy: weakest.accuracy,
    };
  }

  return {
    toMode: 'GeneralPractice',
    nextDiagnosedSubtopic: null,
    weakestAccuracy: null,
  };
}

/**
 * Builds the confirmation modal metadata when all 5 daily questions of a mode are solved.
 */
export function buildModeTransitionInfo(
  currentMode: PlanMode,
  subtopicStats: SubtopicStat[] | null | undefined
): ModeTransitionInfo {
  const { toMode, nextDiagnosedSubtopic, weakestAccuracy } = determineNextPlanMode(subtopicStats);
  const fromLabel = getModeDisplayName(currentMode);

  let reason: string;
  if (toMode === 'RootCause' && nextDiagnosedSubtopic) {
    if (currentMode === 'RootCause') {
      reason = `Great work solving all 5 questions. ${nextDiagnosedSubtopic.name} is still at ${weakestAccuracy}% accuracy (below 70%), so your next Weak-Spot Fix queue will continue targeting ${nextDiagnosedSubtopic.name}.`;
    } else {
      reason = `Based on your accuracy, ${nextDiagnosedSubtopic.name} (${weakestAccuracy}%) is your lowest-scoring subtopic. Ready to move from ${fromLabel} to Weak-Spot Fix?`;
    }
  } else if (currentMode === 'GeneralPractice') {
    reason =
      'All practiced subtopics meet or exceed 70% accuracy. Ready to start a fresh 5-question All-Round Practice set to keep your skills sharp?';
  } else {
    reason = `All practiced subtopics meet or exceed 70% accuracy. Ready to move from ${fromLabel} to All-Round Practice?`;
  }

  return {
    fromMode: currentMode,
    toMode,
    nextDiagnosedSubtopic,
    reason,
  };
}

/**
 * Counts distinct questions attempted (Solved or Attempted, excluding Skipped)
 * on the current local calendar day.
 */
/**
 * Daily streak: the number of distinct questions the student SOLVED today.
 * Only a Solved attempt counts (the code passed every test case and was submitted).
 * Attempted (wrong or partial code), Skipped and Run-only actions never change the streak.
 */
export function countQuestionsAttemptedToday(
  history: AttemptRecord[] | null | undefined,
  now: Date = new Date()
): number {
  if (!Array.isArray(history) || history.length === 0) {
    return 0;
  }

  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth();
  const targetDate = now.getDate();
  const seenQuestions = new Set<string>();

  for (const attempt of history) {
    if (!attempt || attempt.status !== 'Solved' || !attempt.createdAt) {
      continue;
    }
    const parsed = new Date(attempt.createdAt);
    if (Number.isNaN(parsed.getTime())) {
      continue;
    }
    if (
      parsed.getFullYear() === targetYear &&
      parsed.getMonth() === targetMonth &&
      parsed.getDate() === targetDate
    ) {
      const key = attempt.questionID?._id || attempt._id;
      if (key) {
        seenQuestions.add(key);
      }
    }
  }

  return seenQuestions.size;
}

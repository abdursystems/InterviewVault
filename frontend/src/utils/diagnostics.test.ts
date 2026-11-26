import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimer,
  formatDurationHuman,
  buildLatestStatusMap,
  filterQuestions,
  sortSubtopicsByWeakness,
  computePlanProgress,
  validateAuthForm,
  getPythonStarterTemplate,
  extractMockPythonStdout,
  summarizeExecutionResult,
  getModeDisplayName,
  determineNextPlanMode,
  buildModeTransitionInfo,
  countQuestionsAttemptedToday,
  extractTopicId,
  normalizeAccuracy,
  type AttemptRecord,
  type QuestionSummary,
  type SubtopicStat,
  type RecoveryPlan,
} from './diagnostics';

test('formatTimer renders MM:SS with zero padding and handles negative/NaN values', () => {
  assert.equal(formatTimer(0), '00:00');
  assert.equal(formatTimer(65), '01:05');
  assert.equal(formatTimer(600), '10:00');
  assert.equal(formatTimer(-10), '00:00');
  assert.equal(formatTimer(Number.NaN), '00:00');
});

test('formatDurationHuman renders seconds, minutes, and hours cleanly', () => {
  assert.equal(formatDurationHuman(42), '42s');
  assert.equal(formatDurationHuman(125), '2m 05s');
  assert.equal(formatDurationHuman(3665), '1h 01m');
});

test('buildLatestStatusMap selects the chronologically newest attempt per questionID', () => {
  const q1: QuestionSummary = {
    _id: 'q1',
    statement: 'Invert binary tree',
    topicID: { _id: 't1', name: 'DSA' },
    subtopicIDs: [{ _id: 's1', name: 'Recursion' }],
    difficulty: 'Easy',
    type: 'Coding',
  };
  const q2: QuestionSummary = {
    _id: 'q2',
    statement: 'Explain MVCC in PostgreSQL',
    topicID: { _id: 't2', name: 'DBMS' },
    subtopicIDs: [{ _id: 's2', name: 'Transactions & ACID' }],
    difficulty: 'Medium',
    type: 'Theory',
  };

  const history: AttemptRecord[] = [
    { _id: 'a1', questionID: q1, status: 'Attempted', timeTakenSeconds: 180, createdAt: '2026-11-17T10:00:00Z' },
    { _id: 'a2', questionID: q1, status: 'Solved', timeTakenSeconds: 210, createdAt: '2026-11-18T14:00:00Z' },
    { _id: 'a3', questionID: q2, status: 'Skipped', timeTakenSeconds: 15, createdAt: '2026-11-18T12:00:00Z' },
  ];

  const map = buildLatestStatusMap(history);
  assert.deepEqual(map, { q1: 'Solved', q2: 'Skipped' });
  assert.deepEqual(buildLatestStatusMap([]), {});
});

test('filterQuestions supports cascading topic/subtopic, keyword, difficulty, type, and Unattempted status', () => {
  const questions: QuestionSummary[] = [
    {
      _id: 'q1',
      statement: 'Generate Valid Parentheses Combinations',
      topicID: { _id: 't_dsa', name: 'DSA' },
      subtopicIDs: [{ _id: 's_rec', name: 'Recursion' }],
      difficulty: 'Medium',
      type: 'Coding',
    },
    {
      _id: 'q2',
      statement: 'Compare B+ Tree vs Hash Indexes',
      topicID: { _id: 't_dbms', name: 'DBMS' },
      subtopicIDs: [{ _id: 's_idx', name: 'Indexing & B-Trees' }],
      difficulty: 'Easy',
      type: 'Theory',
    },
  ];
  const statusMap = { q1: 'Attempted' as const };

  assert.equal(filterQuestions(questions, { topicID: 't_dbms' }, statusMap).length, 1);
  assert.equal(filterQuestions(questions, { subtopicID: 's_rec' }, statusMap).length, 1);
  assert.equal(filterQuestions(questions, { status: 'Unattempted' }, statusMap)[0]._id, 'q2');
  assert.equal(filterQuestions(questions, { search: 'parentheses' }, statusMap)[0]._id, 'q1');
  assert.equal(filterQuestions(questions, { search: 'nonexistent-xyz' }, statusMap).length, 0);
});

test('sortSubtopicsByWeakness orders lowest accuracy first and breaks ties by oldest practice', () => {
  const stats: SubtopicStat[] = [
    { subtopicID: 's1', subtopicName: 'Graphs', topicName: 'DSA', solved: 4, attempted: 1, skipped: 0, accuracy: 80, lastPracticed: '2026-11-18T10:00:00Z' },
    { subtopicID: 's2', subtopicName: 'Recursion', topicName: 'DSA', solved: 1, attempted: 3, skipped: 0, accuracy: 25, lastPracticed: '2026-11-18T10:00:00Z' },
    { subtopicID: 's3', subtopicName: 'Deadlocks', topicName: 'OS', solved: 1, attempted: 3, skipped: 0, accuracy: 25, lastPracticed: '2026-11-12T10:00:00Z' },
  ];

  const sorted = sortSubtopicsByWeakness(stats);
  assert.deepEqual(sorted.map((s) => s.subtopicID), ['s3', 's2', 's1']);
});

test('computePlanProgress handles null plan, empty items, and partial completion', () => {
  assert.deepEqual(computePlanProgress(null), { completed: 0, total: 0, percent: 0 });
  const plan: RecoveryPlan = {
    _id: 'p1',
    date: '2026-11-19',
    mode: 'Onboarding',
    diagnosedSubtopicID: null,
    items: [
      {
        questionID: {
          _id: 'q1',
          statement: 'Test',
          topicID: { _id: 't1', name: 'DSA' },
          subtopicIDs: [],
          difficulty: 'Easy',
          type: 'Coding',
        },
        role: 'Focus',
        reason: 'Baseline assessment',
        state: 'Completed',
      },
      {
        questionID: {
          _id: 'q2',
          statement: 'Test 2',
          topicID: { _id: 't1', name: 'DSA' },
          subtopicIDs: [],
          difficulty: 'Medium',
          type: 'Theory',
        },
        role: 'Review',
        reason: 'Baseline assessment',
        state: 'Pending',
      },
    ],
  };
  assert.deepEqual(computePlanProgress(plan), { completed: 1, total: 2, percent: 50 });
});

test('validateAuthForm enforces email format, 8-char password minimum, and registration name', () => {
  const loginErrors = validateAuthForm('login', { email: 'not-an-email', password: 'short' });
  assert.ok(loginErrors.email);
  assert.ok(loginErrors.password);
  assert.equal(loginErrors.name, undefined);

  const registerErrors = validateAuthForm('register', { name: '', email: 'a@b.edu', password: 'Password123!' });
  assert.ok(registerErrors.name);
  assert.equal(registerErrors.email, undefined);
  assert.equal(registerErrors.password, undefined);

  const validLogin = validateAuthForm('login', { email: 'student@cs.edu', password: 'Password123!' });
  assert.deepEqual(validLogin, {});
});

test('validateAuthForm requires a matching confirm password only when creating an account', () => {
  const base = { name: 'Maya Chen', email: 'maya@cs.edu', password: 'Password123!' };

  const missing = validateAuthForm('register', base);
  assert.ok(missing.confirmPassword, 'confirmation is required on register');

  const mismatch = validateAuthForm('register', { ...base, confirmPassword: 'Password123' });
  assert.equal(mismatch.confirmPassword, 'Passwords do not match.');

  const match = validateAuthForm('register', { ...base, confirmPassword: 'Password123!' });
  assert.deepEqual(match, {});

  // sign-in has no confirmation field and must not ask for one
  const login = validateAuthForm('login', { email: 'maya@cs.edu', password: 'Password123!' });
  assert.equal(login.confirmPassword, undefined);
});

test('getPythonStarterTemplate extracts function signature from question statement', () => {
  const tpl = getPythonStarterTemplate(
    'Generate Balanced Parentheses\n\nImplement `def generate_parentheses(n: int) -> list[str]` to return all valid combinations.'
  );
  assert.ok(tpl.includes('def generate_parentheses(n: int) -> list[str]:'));
});

test('extractMockPythonStdout returns empty string when code only returns values without printing', () => {
  const code = `
def solve(nums):
    # print("commented out debug")
    total = 0
    for x in nums:
        total += x
    return total
`;
  assert.equal(extractMockPythonStdout(code), '');
});

test('extractMockPythonStdout evaluates literals, variables, f-strings, sep/end, and ignores comments', () => {
  const code = `
count = 3
label = "nodes"
# print("ignored")
print("Hello", label, count)
print(f"count={count}")
print("a", "b", sep="-", end="!")
`;
  assert.equal(extractMockPythonStdout(code), 'Hello nodes 3\ncount=3\na-b!');
});

test('summarizeExecutionResult separates clean execution, printed output, pass/fail, and syntax errors', () => {
  const returnOnlyPass = summarizeExecutionResult({
    status: 'Solved',
    stdout: '',
    testDetails: [{ passed: true }, { passed: true }],
  });
  assert.equal(returnOnlyPass.hasError, false);
  assert.equal(returnOnlyPass.allPassed, true);
  assert.equal(returnOnlyPass.passedCount, 2);
  assert.equal(returnOnlyPass.totalCount, 2);
  assert.equal(returnOnlyPass.hasPrintedOutput, false);

  const printedFail = summarizeExecutionResult({
    status: 'Attempted',
    stdout: 'debug line\n',
    testDetails: [{ passed: true }, { passed: false }],
  });
  assert.equal(printedFail.hasError, false);
  assert.equal(printedFail.allPassed, false);
  assert.equal(printedFail.statusLabel, 'Failed');
  assert.equal(printedFail.hasPrintedOutput, true);
  assert.equal(printedFail.printedOutput, 'debug line');

  const syntaxErr = summarizeExecutionResult({
    status: 'Attempted',
    stdout: 'should not show',
    testDetails: [{ passed: false, error: 'SyntaxError: unmatched parenthesis' }],
  });
  assert.equal(syntaxErr.hasError, true);
  assert.equal(syntaxErr.errorMessage, 'SyntaxError: unmatched parenthesis');
  assert.equal(syntaxErr.hasPrintedOutput, false);
  assert.equal(syntaxErr.statusLabel, 'Failed');
});

test('getModeDisplayName maps backend plan modes to student-facing labels', () => {
  assert.equal(getModeDisplayName('Onboarding'), 'Initial Assessment');
  assert.equal(getModeDisplayName('GeneralPractice'), 'All-Round Practice');
  assert.equal(getModeDisplayName('RootCause'), 'Weak-Spot Fix');
});

test('determineNextPlanMode and buildModeTransitionInfo choose Weak-Spot Fix or All-Round Practice from accuracy', () => {
  const weakStats: SubtopicStat[] = [
    { subtopicID: 's1', subtopicName: 'Graphs', topicName: 'DSA', solved: 3, attempted: 0, skipped: 0, accuracy: 100, lastPracticed: '2026-11-20T10:00:00Z' },
    { subtopicID: 's2', subtopicName: 'Recursion', topicName: 'DSA', solved: 1, attempted: 2, skipped: 0, accuracy: 33, lastPracticed: '2026-11-20T10:00:00Z' },
  ];
  const toRootCause = buildModeTransitionInfo('Onboarding', weakStats);
  assert.equal(toRootCause.fromMode, 'Onboarding');
  assert.equal(toRootCause.toMode, 'RootCause');
  assert.equal(toRootCause.nextDiagnosedSubtopic?.name, 'Recursion');
  assert.ok(toRootCause.reason.includes('Initial Assessment'));
  assert.ok(toRootCause.reason.includes('Weak-Spot Fix'));

  const strongStats: SubtopicStat[] = [
    { subtopicID: 's1', subtopicName: 'Graphs', topicName: 'DSA', solved: 3, attempted: 0, skipped: 0, accuracy: 100, lastPracticed: '2026-11-20T10:00:00Z' },
    { subtopicID: 's2', subtopicName: 'Recursion', topicName: 'DSA', solved: 3, attempted: 1, skipped: 0, accuracy: 75, lastPracticed: '2026-11-20T10:00:00Z' },
  ];
  const nextStrong = determineNextPlanMode(strongStats);
  assert.equal(nextStrong.toMode, 'GeneralPractice');
  assert.equal(nextStrong.nextDiagnosedSubtopic, null);

  const toGeneral = buildModeTransitionInfo('RootCause', strongStats);
  assert.equal(toGeneral.toMode, 'GeneralPractice');
  assert.ok(toGeneral.reason.includes('All-Round Practice'));
});

test('countQuestionsAttemptedToday counts unique non-skipped questions attempted on the current local day', () => {
  const now = new Date(2026, 10, 21, 14, 0, 0);
  const mkQ = (id: string): QuestionSummary => ({
    _id: id,
    statement: `Question ${id}`,
    topicID: { _id: 't1', name: 'DSA' },
    subtopicIDs: [],
    difficulty: 'Easy',
    type: 'Coding',
  });

  const history: AttemptRecord[] = [
    { _id: 'a1', questionID: mkQ('q1'), status: 'Attempted', timeTakenSeconds: 120, createdAt: new Date(2026, 10, 21, 9, 15, 0).toISOString() },
    { _id: 'a2', questionID: mkQ('q1'), status: 'Solved', timeTakenSeconds: 180, createdAt: new Date(2026, 10, 21, 10, 0, 0).toISOString() },
    { _id: 'a3', questionID: mkQ('q2'), status: 'Solved', timeTakenSeconds: 95, createdAt: new Date(2026, 10, 21, 11, 30, 0).toISOString() },
    { _id: 'a4', questionID: mkQ('q3'), status: 'Skipped', timeTakenSeconds: 10, createdAt: new Date(2026, 10, 21, 12, 0, 0).toISOString() },
    { _id: 'a5', questionID: mkQ('q4'), status: 'Solved', timeTakenSeconds: 200, createdAt: new Date(2026, 10, 20, 23, 30, 0).toISOString() },
  ];

  assert.equal(countQuestionsAttemptedToday(history, now), 2);
  assert.equal(countQuestionsAttemptedToday([], now), 0);
});

test('countQuestionsAttemptedToday ignores wrong or partial submissions (only Solved counts)', () => {
  const now = new Date(2026, 10, 21, 14, 0, 0);
  const mkQ = (id: string): QuestionSummary => ({
    _id: id,
    statement: `Question ${id}`,
    topicID: { _id: 't1', name: 'DSA' },
    subtopicIDs: [],
    difficulty: 'Easy',
    type: 'Coding',
  });
  const wrongOnly: AttemptRecord[] = [
    { _id: 'w1', questionID: mkQ('q1'), status: 'Attempted', timeTakenSeconds: 60, createdAt: new Date(2026, 10, 21, 9, 0, 0).toISOString() },
    { _id: 'w2', questionID: mkQ('q2'), status: 'Attempted', timeTakenSeconds: 60, createdAt: new Date(2026, 10, 21, 10, 0, 0).toISOString() },
  ];
  assert.equal(countQuestionsAttemptedToday(wrongOnly, now), 0, 'failed submissions must not change the streak');

  const oneSolved: AttemptRecord[] = [
    ...wrongOnly,
    { _id: 's1', questionID: mkQ('q1'), status: 'Solved', timeTakenSeconds: 90, createdAt: new Date(2026, 10, 21, 11, 0, 0).toISOString() },
  ];
  assert.equal(countQuestionsAttemptedToday(oneSolved, now), 1);
});

test('extractTopicId normalizes populated objects, raw string IDs, and nullish values', () => {
  assert.equal(extractTopicId({ _id: 'topic_dsa', name: 'DSA' }), 'topic_dsa');
  assert.equal(extractTopicId('topic_os'), 'topic_os');
  assert.equal(extractTopicId(null), '');
  assert.equal(extractTopicId(undefined), '');
});

test('normalizeAccuracy guards NaN, nullish, negative, and >100 values to finite 0-100 integers', () => {
  assert.equal(normalizeAccuracy(Number.NaN), 0);
  assert.equal(normalizeAccuracy(undefined), 0);
  assert.equal(normalizeAccuracy(-15), 0);
  assert.equal(normalizeAccuracy(128.4), 100);
  assert.equal(normalizeAccuracy(66.6), 67);
});

test('sortSubtopicsByWeakness guards missing or NaN numeric stats without producing NaN', () => {
  const dirty = [
    {
      subtopicID: 's1',
      subtopicName: 'DP',
      topicName: 'DSA',
      solved: Number.NaN,
      attempted: Number.NaN,
      skipped: Number.NaN,
      accuracy: Number.NaN,
      lastPracticed: null,
    },
  ] as SubtopicStat[];
  const sorted = sortSubtopicsByWeakness(dirty);
  assert.equal(sorted[0].accuracy, 0);
  assert.equal(sorted[0].solved, 0);
  assert.equal(sorted[0].attempted, 0);
  assert.equal(sorted[0].skipped, 0);
});


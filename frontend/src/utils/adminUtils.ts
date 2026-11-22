export interface AdminTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface AdminQuestionFormPayload {
  statement: string;
  topicID: string;
  subtopicIDs: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'Theory' | 'Coding';
  modelAnswer: string;
  testCases: AdminTestCase[];
}

export interface AdminValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates Admin Question create/edit payloads matching backend rules:
 * - Statement required
 * - Valid topicID required
 * - 1 to 3 subtopicIDs belonging strictly to the selected topicID
 * - Theory requires non-empty modelAnswer
 * - Coding requires >= 1 test case with non-empty expectedOutput
 */
export function validateAdminQuestionPayload(
  payload: Partial<AdminQuestionFormPayload>,
  allowedSubtopicIdsForTopic?: Set<string> | string[]
): AdminValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.statement || !payload.statement.trim()) {
    errors.statement = 'Question statement is required.';
  }

  if (!payload.topicID) {
    errors.topicID = 'Select a core topic.';
  }

  const subIds = Array.isArray(payload.subtopicIDs)
    ? Array.from(new Set(payload.subtopicIDs.filter(Boolean)))
    : [];

  if (subIds.length < 1 || subIds.length > 3) {
    errors.subtopicIDs = 'Select between 1 and 3 subtopic tags.';
  } else if (allowedSubtopicIdsForTopic) {
    const allowedSet =
      allowedSubtopicIdsForTopic instanceof Set
        ? allowedSubtopicIdsForTopic
        : new Set(allowedSubtopicIdsForTopic);
    const invalid = subIds.some((id) => !allowedSet.has(id));
    if (invalid) {
      errors.subtopicIDs = 'All selected subtopics must belong to the chosen topic.';
    }
  }

  if (!payload.difficulty || !['Easy', 'Medium', 'Hard'].includes(payload.difficulty)) {
    errors.difficulty = 'Select a valid difficulty level.';
  }

  if (!payload.type || !['Theory', 'Coding'].includes(payload.type)) {
    errors.type = 'Select Theory or Coding.';
  }

  if (payload.type === 'Theory') {
    if (!payload.modelAnswer || !payload.modelAnswer.trim()) {
      errors.modelAnswer = 'A structured model answer is required for Theory questions.';
    }
  } else if (payload.type === 'Coding') {
    const cases = Array.isArray(payload.testCases) ? payload.testCases : [];
    const validCases = cases.filter(
      (tc) => tc && typeof tc.expectedOutput === 'string' && tc.expectedOutput.trim().length > 0
    );
    if (cases.length === 0 || validCases.length === 0) {
      errors.testCases = 'Add at least 1 test case with a non-empty expected output.';
    } else if (validCases.length !== cases.length) {
      errors.testCases = 'Every test case must include a non-empty expected output.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Order-independent set comparison used to detect subtopic tag changes on attempted questions.
 */
export function hasSubtopicTagSetChanged(
  originalIds: string[] | null | undefined,
  nextIds: string[] | null | undefined
): boolean {
  const a = new Set((originalIds || []).filter(Boolean));
  const b = new Set((nextIds || []).filter(Boolean));
  if (a.size !== b.size) return true;
  for (const id of a) {
    if (!b.has(id)) return true;
  }
  return false;
}


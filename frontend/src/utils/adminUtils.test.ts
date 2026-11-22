import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAdminQuestionPayload,
  hasSubtopicTagSetChanged,
} from './adminUtils';

test('validateAdminQuestionPayload enforces 1-3 subtopics belonging to topic and type-specific rules', () => {
  const allowed = new Set(['s1', 's2', 's3', 's4']);

  // Missing subtopics & missing modelAnswer for Theory
  const invalidTheory = validateAdminQuestionPayload(
    {
      statement: 'Explain ACID',
      topicID: 't_dbms',
      subtopicIDs: [],
      difficulty: 'Medium',
      type: 'Theory',
      modelAnswer: '   ',
      testCases: [],
    },
    allowed
  );
  assert.equal(invalidTheory.valid, false);
  assert.ok(invalidTheory.errors.subtopicIDs);
  assert.ok(invalidTheory.errors.modelAnswer);

  // Too many subtopics (>3)
  const tooMany = validateAdminQuestionPayload(
    {
      statement: 'Valid statement',
      topicID: 't_dbms',
      subtopicIDs: ['s1', 's2', 's3', 's4'],
      difficulty: 'Easy',
      type: 'Theory',
      modelAnswer: 'Detailed model answer.',
      testCases: [],
    },
    allowed
  );
  assert.equal(tooMany.valid, false);
  assert.ok(tooMany.errors.subtopicIDs);

  // Subtopic outside chosen topic
  const crossTopic = validateAdminQuestionPayload(
    {
      statement: 'Valid statement',
      topicID: 't_dbms',
      subtopicIDs: ['s_other_topic'],
      difficulty: 'Easy',
      type: 'Theory',
      modelAnswer: 'Detailed model answer.',
      testCases: [],
    },
    allowed
  );
  assert.equal(crossTopic.valid, false);
  assert.ok(crossTopic.errors.subtopicIDs);

  // Coding requires >=1 test case with non-empty expectedOutput
  const badCoding = validateAdminQuestionPayload(
    {
      statement: 'Reverse linked list',
      topicID: 't_dsa',
      subtopicIDs: ['s1'],
      difficulty: 'Easy',
      type: 'Coding',
      modelAnswer: '',
      testCases: [{ input: '[1,2]', expectedOutput: '  ', isHidden: false }],
    },
    allowed
  );
  assert.equal(badCoding.valid, false);
  assert.ok(badCoding.errors.testCases);

  // Valid Coding payload
  const goodCoding = validateAdminQuestionPayload(
    {
      statement: 'Reverse linked list',
      topicID: 't_dsa',
      subtopicIDs: ['s1', 's2'],
      difficulty: 'Medium',
      type: 'Coding',
      modelAnswer: '',
      testCases: [{ input: '[1,2]', expectedOutput: '[2,1]', isHidden: true }],
    },
    allowed
  );
  assert.equal(goodCoding.valid, true);
  assert.deepEqual(goodCoding.errors, {});
});

test('hasSubtopicTagSetChanged compares subtopic ID sets regardless of order', () => {
  assert.equal(hasSubtopicTagSetChanged(['s1', 's2'], ['s2', 's1']), false);
  assert.equal(hasSubtopicTagSetChanged(['s1', 's2'], ['s1', 's3']), true);
  assert.equal(hasSubtopicTagSetChanged(['s1'], ['s1', 's2']), true);
});


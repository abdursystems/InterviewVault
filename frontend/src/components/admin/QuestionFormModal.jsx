import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Check,
  Code2,
  FileText,
} from 'lucide-react';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import { validateAdminQuestionPayload } from '../../utils/adminUtils';
import { extractTopicId } from '../../utils/diagnostics';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TYPES = ['Coding', 'Theory'];

function makeEmptyForm(defaultTopicId = '') {
  return {
    statement: '',
    topicID: defaultTopicId,
    subtopicIDs: [],
    difficulty: 'Medium',
    type: 'Coding',
    modelAnswer: '',
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
  };
}

export default function QuestionFormModal({
  isOpen,
  questionId = null,
  topics = [],
  subtopics = [],
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(questionId);
  const [form, setForm] = useState(() => makeEmptyForm(topics[0]?._id || ''));
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    setFieldErrors({});
    setServerError('');
    setServerStatus(null);

    if (!questionId) {
      setLoadingRecord(false);
      setForm(makeEmptyForm(topics[0]?._id || ''));
      return undefined;
    }

    setLoadingRecord(true);
    adminAPI
      .getQuestionById(questionId)
      .then((q) => {
        if (!active) return;
        const resolvedTopicId = extractTopicId(q.topicID);
        const resolvedSubIds = Array.isArray(q.subtopicIDs)
          ? q.subtopicIDs.map((s) => (typeof s === 'object' ? s?._id : s)).filter(Boolean)
          : [];
        const resolvedTestCases =
          Array.isArray(q.testCases) && q.testCases.length > 0
            ? q.testCases.map((tc) => ({
                input: tc.input ?? '',
                expectedOutput: tc.expectedOutput ?? '',
                isHidden: Boolean(tc.isHidden),
              }))
            : [{ input: '', expectedOutput: '', isHidden: false }];

        setForm({
          statement: q.statement || '',
          topicID: resolvedTopicId,
          subtopicIDs: resolvedSubIds,
          difficulty: q.difficulty || 'Medium',
          type: q.type || 'Coding',
          modelAnswer: q.modelAnswer || '',
          testCases: resolvedTestCases,
        });
      })
      .catch((err) => {
        if (!active) return;
        setServerStatus(err?.response?.status || 500);
        setServerError(getApiErrorMessage(err, 'Failed to load question details.'));
      })
      .finally(() => {
        if (active) setLoadingRecord(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, questionId, topics]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, submitting, onClose]);

  const filteredSubtopics = useMemo(() => {
    if (!form.topicID) return [];
    return subtopics.filter((s) => extractTopicId(s.topicID) === form.topicID);
  }, [subtopics, form.topicID]);

  if (!isOpen) return null;

  const handleTopicChange = (nextTopicId) => {
    const allowedIds = new Set(
      subtopics.filter((s) => extractTopicId(s.topicID) === nextTopicId).map((s) => s._id)
    );
    setForm((prev) => ({
      ...prev,
      topicID: nextTopicId,
      subtopicIDs: prev.subtopicIDs.filter((id) => allowedIds.has(id)),
    }));
    setFieldErrors((prev) => ({ ...prev, topicID: '', subtopicIDs: '' }));
  };

  const toggleSubtopic = (subId) => {
    setForm((prev) => {
      const exists = prev.subtopicIDs.includes(subId);
      if (exists) {
        return { ...prev, subtopicIDs: prev.subtopicIDs.filter((id) => id !== subId) };
      }
      if (prev.subtopicIDs.length >= 3) {
        return prev;
      }
      return { ...prev, subtopicIDs: [...prev.subtopicIDs, subId] };
    });
    setFieldErrors((prev) => ({ ...prev, subtopicIDs: '' }));
    setServerError('');
    setServerStatus(null);
  };

  const handleTestCaseChange = (index, field, value) => {
    setForm((prev) => {
      const next = prev.testCases.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc));
      return { ...prev, testCases: next };
    });
    setFieldErrors((prev) => ({ ...prev, testCases: '' }));
  };

  const addTestCase = () => {
    setForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '', isHidden: false }],
    }));
  };

  const removeTestCase = (index) => {
    setForm((prev) => {
      if (prev.testCases.length <= 1) return prev;
      return {
        ...prev,
        testCases: prev.testCases.filter((_, i) => i !== index),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerStatus(null);

    const allowedIds = new Set(filteredSubtopics.map((s) => s._id));
    const payload = {
      statement: form.statement.trim(),
      topicID: form.topicID,
      subtopicIDs: form.subtopicIDs,
      difficulty: form.difficulty,
      type: form.type,
      modelAnswer: form.type === 'Theory' ? form.modelAnswer.trim() : '',
      testCases:
        form.type === 'Coding'
          ? form.testCases.map((tc) => ({
              input: tc.input ?? '',
              expectedOutput: (tc.expectedOutput ?? '').trim(),
              isHidden: Boolean(tc.isHidden),
            }))
          : [],
    };

    const validation = validateAdminQuestionPayload(payload, allowedIds);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const saved = isEdit
        ? await adminAPI.updateQuestion(questionId, payload)
        : await adminAPI.createQuestion(payload);
      onSaved(saved, isEdit);
      onClose();
    } catch (err) {
      const status = err?.response?.status || 500;
      const msg = getApiErrorMessage(err, 'Unable to save question.');
      setServerStatus(status);
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-form-modal-title"
      data-lenis-prevent
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isEdit ? 'Edit Question Record' : 'Create Question Record'}
            </p>
            <h2
              id="question-form-modal-title"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5"
            >
              {isEdit ? 'Update Question Bank Item' : 'Add Question to Bank'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {loadingRecord ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-mono">Loading full question payload...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" data-lenis-prevent>
              {/* 409 Integrity Guard / Server Error Banner */}
              {serverError && (
                <div
                  role="alert"
                  data-testid="question-modal-error-banner"
                  className={`rounded-lg border p-3.5 text-xs flex items-start gap-2.5 ${
                    serverStatus === 409
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                      : 'border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-0.5">
                    {serverStatus === 409 && (
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-wide">
                        409 Integrity Guard
                      </p>
                    )}
                    <p className="leading-relaxed">{serverError}</p>
                  </div>
                </div>
              )}

              {/* Statement */}
              <div>
                <label
                  htmlFor="admin-q-statement"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Question Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="admin-q-statement"
                  rows={4}
                  value={form.statement}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, statement: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, statement: '' }));
                  }}
                  placeholder="Write the complete problem prompt, constraints, and expected function signature or conceptual scope..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                />
                {fieldErrors.statement && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {fieldErrors.statement}
                  </p>
                )}
              </div>

              {/* Topic, Difficulty, Type row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="admin-q-topic"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Topic <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="admin-q-topic"
                    value={form.topicID}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-2.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    <option value="">Select topic...</option>
                    {topics.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.topicID && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                      {fieldErrors.topicID}
                    </p>
                  )}
                </div>

                <div>
                  <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Difficulty <span className="text-rose-500">*</span>
                  </span>
                  <div className="grid grid-cols-3 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#09090B] p-0.5 h-9">
                    {DIFFICULTIES.map((diff) => {
                      const active = form.difficulty === diff;
                      return (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, difficulty: diff }))}
                          className={`text-xs font-medium rounded-md transition-colors ${
                            active
                              ? 'bg-white dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 shadow-xs'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          {diff}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Format <span className="text-rose-500">*</span>
                  </span>
                  <div className="grid grid-cols-2 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#09090B] p-0.5 h-9">
                    {TYPES.map((t) => {
                      const active = form.type === t;
                      const Icon = t === 'Coding' ? Code2 : FileText;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, type: t }));
                            setFieldErrors((prev) => ({
                              ...prev,
                              modelAnswer: '',
                              testCases: '',
                            }));
                          }}
                          className={`inline-flex items-center justify-center gap-1 text-xs font-medium rounded-md transition-colors ${
                            active
                              ? 'bg-white dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 shadow-xs'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Subtopics multi-select (1-3 strictly filtered by topicID) */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Subtopic Tags <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      form.subtopicIDs.length === 0
                        ? 'text-zinc-400 dark:text-zinc-500'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {form.subtopicIDs.length}/3 selected
                  </span>
                </div>

                {filteredSubtopics.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-200 dark:border-[#27272A] px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    No subtopics available for the selected topic. Create one in Subtopic Taxonomy
                    first.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#09090B] p-3">
                    {filteredSubtopics.map((sub) => {
                      const selected = form.subtopicIDs.includes(sub._id);
                      const disabled = !selected && form.subtopicIDs.length >= 3;
                      return (
                        <button
                          key={sub._id}
                          type="button"
                          onClick={() => toggleSubtopic(sub._id)}
                          disabled={disabled}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            selected
                              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                              : 'bg-white dark:bg-[#111114] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272A] hover:border-zinc-400 dark:hover:border-zinc-500'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {selected && <Check className="w-3 h-3 shrink-0" aria-hidden="true" />}
                          <span>{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {fieldErrors.subtopicIDs && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {fieldErrors.subtopicIDs}
                  </p>
                )}
              </div>

              {/* Conditional Section: Theory Model Answer OR Coding Test Case Builder */}
              {form.type === 'Theory' ? (
                <div>
                  <label
                    htmlFor="admin-q-model-answer"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Model Answer <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="admin-q-model-answer"
                    rows={5}
                    value={form.modelAnswer}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, modelAnswer: e.target.value }));
                      setFieldErrors((prev) => ({ ...prev, modelAnswer: '' }));
                    }}
                    placeholder="Provide the canonical explanation and key rubric points students compare against during self-assessment..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  />
                  {fieldErrors.modelAnswer && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                      {fieldErrors.modelAnswer}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Python Sandbox Test Cases <span className="text-rose-500">*</span>
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        At least 1 test case with a non-empty expected output is required. Hidden
                        cases are withheld from student view.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Case</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.testCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-zinc-50/60 dark:bg-[#09090B] p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                            Case #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTestCaseChange(idx, 'isHidden', !tc.isHidden)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                                tc.isHidden
                                  ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25'
                                  : 'text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#111114] border-zinc-200 dark:border-[#27272A]'
                              }`}
                            >
                              {tc.isHidden ? (
                                <>
                                  <EyeOff className="w-3 h-3" aria-hidden="true" />
                                  <span>Hidden</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" aria-hidden="true" />
                                  <span>Visible</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeTestCase(idx)}
                              disabled={form.testCases.length <= 1}
                              aria-label={`Remove test case ${idx + 1}`}
                              className="w-6 h-6 inline-flex items-center justify-center rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                              Input
                            </label>
                            <input
                              type="text"
                              value={tc.input}
                              onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                              placeholder="e.g. nums=[1,2,3], target=4"
                              className="w-full h-8 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                              Expected Output <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={tc.expectedOutput}
                              onChange={(e) =>
                                handleTestCaseChange(idx, 'expectedOutput', e.target.value)
                              }
                              placeholder="e.g. [[1,3],[2,2]]"
                              className="w-full h-8 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {fieldErrors.testCases && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      {fieldErrors.testCases}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#09090B]/60 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3.5 py-2 text-xs font-medium rounded-md border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                data-testid="question-modal-submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEdit ? 'Save Changes' : 'Create Question'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

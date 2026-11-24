import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Play,
  Send,
  SkipForward,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { DifficultyBadge, StatusBadge } from '../components/Badge';
import ConfirmModal from '../components/ConfirmModal';
import ModeTransitionModal from '../components/ModeTransitionModal';
import PythonEditor from '../components/PythonEditor';
import { SkeletonBlock } from '../components/Skeleton';
import { useTheme } from '../context/ThemeContext';
import { attemptsAPI, questionsAPI, recoveryPlanAPI, getApiErrorMessage } from '../services/api';
import {
  extractQuestionHeadline,
  formatTimer,
  getPythonStarterTemplate,
  summarizeExecutionResult,
} from '../utils/diagnostics';

const draftKey = (id) => `iv_draft_${id}`;

function FormattedStatement({ text }) {
  if (!text) return null;
  const blocks = text.split('\n\n');

  return (
    <div className="space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const trimmedFirst = lines[0].trim();

        if (trimmedFirst.startsWith('### ')) {
          return (
            <div key={i} className="space-y-2">
              <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {trimmedFirst.replace(/^###\s+/, '')}
              </h3>
              {lines.slice(1).length > 0 && (
                <FormattedStatement text={lines.slice(1).join('\n')} />
              )}
            </div>
          );
        }

        if (lines.every((l) => l.trim().startsWith('- ') || /^\d+\.\s/.test(l.trim()))) {
          return (
            <ul key={i} className="space-y-1.5 list-disc pl-5 text-zinc-700 dark:text-zinc-300">
              {lines.map((line, idx) => (
                <li key={idx}>
                  <InlineCodeText text={line.trim().replace(/^(-\s+|\d+\.\s+)/, '')} />
                </li>
              ))}
            </ul>
          );
        }

        if (trimmedFirst.startsWith('|') && lines.length >= 2) {
          const rows = lines
            .filter((l) => !/^\|[\s:|-]+\|$/.test(l.trim()))
            .map((l) =>
              l
                .trim()
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map((c) => c.trim())
            );
          return (
            <div
              key={i}
              className="overflow-x-auto rounded-md border border-zinc-200 dark:border-[#27272A]"
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-[#16161A] border-b border-zinc-200 dark:border-[#27272A]">
                    {rows[0]?.map((h, hi) => (
                      <th key={hi} className="py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A]">
                  {rows.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                          <InlineCodeText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (trimmedFirst.startsWith('Example:') || trimmedFirst.startsWith('Constraints:')) {
          return (
            <div
              key={i}
              className="rounded-md bg-zinc-50 dark:bg-[#0D0D10] border border-zinc-200 dark:border-[#27272A] p-3.5 font-mono text-xs space-y-1 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap"
            >
              {block}
            </div>
          );
        }

        return (
          <p key={i} className="whitespace-pre-line">
            <InlineCodeText text={block} />
          </p>
        );
      })}
    </div>
  );
}

function InlineCodeText({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#1C1C21] border border-zinc-200 dark:border-[#27272A] text-[12px] font-mono text-zinc-900 dark:text-zinc-100"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={idx} className="font-semibold text-zinc-900 dark:text-zinc-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

export default function QuestionWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Draft & editor state
  const [content, setContent] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [lastFailedAction, setLastFailedAction] = useState(null);

  // Coding console state
  const [consoleTab, setConsoleTab] = useState('cases');
  const [submitting, setSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Theory self-assessment flow state
  const [theoryRevealed, setTheoryRevealed] = useState(false);
  const [theorySavedStatus, setTheorySavedStatus] = useState(null);

  // Skip modal
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // Mode-completion confirmation modal (triggered at 5/5 Solved)
  const [completedPlan, setCompletedPlan] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [advancingMode, setAdvancingMode] = useState(false);
  const [transitionError, setTransitionError] = useState('');

  const timerRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setQuestion(null);
      setLoadError('');
      setExecutionResult(null);
      setConsoleTab('cases');
      setIsSubmitted(false);
      setActiveAction(null);
      setLastFailedAction(null);
      setSkipModalOpen(false);
      setPendingTransition(null);
      setCompletedPlan(null);
      setTransitionModalOpen(false);
      setTransitionError('');
      setTheoryRevealed(false);
      setTheorySavedStatus(null);
      setValidationError('');
      setSaveError('');
      setElapsedSeconds(0);

      try {
        const data = await questionsAPI.getQuestionById(id);
        if (!active) return;
        setQuestion(data);

        // Restore auto-saved draft from localStorage or load starter template
        const savedDraft = localStorage.getItem(draftKey(id));
        if (savedDraft !== null) {
          setContent(savedDraft);
        } else if (data.type === 'Coding') {
          setContent(getPythonStarterTemplate(data.statement));
        } else {
          setContent('');
        }
      } catch (err) {
        if (active) {
          setLoadError(
            getApiErrorMessage(err, 'Unable to load this question. It may not exist.')
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  // Live session timer
  useEffect(() => {
    if (loading || !question) return;
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [loading, question]);

  // Auto-save draft to localStorage keyed by questionID (guarded against cross-question overwrite)
  useEffect(() => {
    if (!id || loading || !question || question._id !== id) return;
    try {
      localStorage.setItem(draftKey(id), content);
    } catch {
      // ignore quota error
    }
  }, [id, content, loading, question]);

  const visibleTestCases = useMemo(() => {
    if (!Array.isArray(question?.testCases)) return [];
    return question.testCases.filter((tc) => !tc.isHidden);
  }, [question]);

  const hiddenTestCount = useMemo(() => {
    if (typeof question?.hiddenTestCount === 'number' && Number.isFinite(question.hiddenTestCount)) {
      return Math.max(0, question.hiddenTestCount);
    }
    if (!Array.isArray(question?.testCases)) return 0;
    return question.testCases.filter((tc) => tc.isHidden).length;
  }, [question]);

  const executionSummary = useMemo(
    () => (executionResult ? summarizeExecutionResult(executionResult) : null),
    [executionResult]
  );

  const headline = extractQuestionHeadline(question?.statement);
  const bodyWithoutHeadline = useMemo(() => {
    if (!question?.statement) return '';
    const lines = question.statement.split('\n');
    return lines.slice(1).join('\n').trim();
  }, [question?.statement]);

  const checkForModeCompletion = async () => {
    try {
      const planRes = await recoveryPlanAPI.getRecoveryPlan();
      if (planRes?.pendingTransition) {
        setCompletedPlan(planRes.plan || null);
        setPendingTransition(planRes.pendingTransition);
        setTransitionError('');
        setTransitionModalOpen(true);
      }
    } catch {
      // Non-blocking: recovery plan page will still surface the confirmation gate
    }
  };

  const handleConfirmNextMode = async () => {
    setAdvancingMode(true);
    setTransitionError('');
    try {
      await recoveryPlanAPI.advanceRecoveryMode(completedPlan);
      setTransitionModalOpen(false);
      setPendingTransition(null);
      navigate('/recovery-plan');
    } catch (err) {
      setTransitionError(
        getApiErrorMessage(err, 'Unable to advance to the next mode. Please try again.')
      );
    } finally {
      setAdvancingMode(false);
    }
  };

  // Coding Run & Submit both invoke POST /api/attempts with status: "Attempted"
  const executeCodingAttempt = async (action = 'submit') => {
    setValidationError('');
    setSaveError('');

    if (!content.trim()) {
      setValidationError('Submission cannot be empty. Write Python code before running or submitting.');
      return;
    }

    setSubmitting(true);
    setActiveAction(action);
    setLastFailedAction(null);
    try {
      const res = await attemptsAPI.submitAttempt({
        questionID: question._id,
        submittedCodeOrText: content,
        timeTakenSeconds: elapsedSeconds,
        status: 'Attempted',
      });
      setExecutionResult(res);
      setConsoleTab('output');
      if (action === 'submit') {
        setIsSubmitted(true);
      }
      if (res?.status === 'Solved') {
        await checkForModeCompletion();
      }
    } catch (err) {
      setSaveError(
        getApiErrorMessage(
          err,
          'Failed to submit attempt to server. Your draft has been preserved locally.'
        )
      );
      setLastFailedAction(() => () => executeCodingAttempt(action));
    } finally {
      setSubmitting(false);
      setActiveAction(null);
    }
  };

  const handleCodeChange = (nextValue) => {
    setContent(nextValue);
    if (isSubmitted) setIsSubmitted(false);
    if (validationError) setValidationError('');
  };

  // Theory Step 1: Validate non-empty answer and reveal side-by-side model answer
  const handleTheoryReveal = () => {
    setValidationError('');
    setSaveError('');
    if (!content.trim()) {
      setValidationError(
        'Enter your written explanation before comparing against the model answer, or choose Skip.'
      );
      return;
    }
    setTheoryRevealed(true);
  };

  // Theory Step 2: Explicit self-assessment submission ("Solved" or "Attempted")
  const handleTheorySelfAssess = async (chosenStatus) => {
    setSaveError('');
    setSubmitting(true);
    setLastFailedAction(null);
    try {
      const res = await attemptsAPI.submitAttempt({
        questionID: question._id,
        submittedCodeOrText: content,
        timeTakenSeconds: elapsedSeconds,
        status: chosenStatus,
      });
      const finalStatus = res.status || chosenStatus;
      setTheorySavedStatus({
        status: finalStatus,
        message: res.message || 'Self-assessment saved.',
      });
      if (finalStatus === 'Solved') {
        await checkForModeCompletion();
      }
    } catch (err) {
      setSaveError(
        getApiErrorMessage(
          err,
          'Could not save your self-assessment. Your draft is safely preserved—please retry.'
        )
      );
      setLastFailedAction(() => () => handleTheorySelfAssess(chosenStatus));
    } finally {
      setSubmitting(false);
    }
  };

  // Skip confirmation handler
  const handleConfirmSkip = async () => {
    setSkipping(true);
    setSaveError('');
    try {
      await attemptsAPI.submitAttempt({
        questionID: question._id,
        submittedCodeOrText: content || '',
        timeTakenSeconds: elapsedSeconds,
        status: 'Skipped',
      });
      setSkipModalOpen(false);
      navigate('/recovery-plan');
    } catch (err) {
      setSkipModalOpen(false);
      setSaveError(
        getApiErrorMessage(
          err,
          'Could not record skip status. Your draft is preserved—please retry.'
        )
      );
      setLastFailedAction(() => handleConfirmSkip);
    } finally {
      setSkipping(false);
    }
  };

  const handleResetTemplate = () => {
    if (!question) return;
    if (question.type === 'Coding') {
      setContent(getPythonStarterTemplate(question.statement));
      setIsSubmitted(false);
    } else {
      setContent('');
      setTheoryRevealed(false);
      setTheorySavedStatus(null);
    }
    setValidationError('');
  };

  return (
    <AppShell fullWidth>
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-7rem)]">
          <div className="lg:col-span-5 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 space-y-4">
            <SkeletonBlock className="h-6 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-32 w-full" />
          </div>
          <div className="lg:col-span-7 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 space-y-4">
            <SkeletonBlock className="h-72 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
        </div>
      ) : loadError || !question ? (
        <div className="max-w-xl mx-auto my-12 rounded-lg border border-rose-500/30 bg-rose-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" aria-hidden="true" />
            <div>
              <h1 className="text-sm font-semibold">Question unavailable</h1>
              <p className="mt-1 text-xs">{loadError || 'Question not found.'}</p>
            </div>
          </div>
          <Link
            to="/questions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Problems</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top Workspace Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/questions"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Questions</span>
              </Link>
              <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                /
              </span>
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {question.topicID?.name}
              </span>
              <DifficultyBadge difficulty={question.difficulty} />
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {question.type === 'Coding' ? 'Python 3' : 'Theory'}
              </span>
            </div>

            {/* Live Mono-Spaced Session Timer */}
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] text-xs font-mono tabular-nums text-zinc-800 dark:text-zinc-200"
                aria-label="Session timer"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                <span data-testid="session-timer">{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Save Failure Retry Banner (preserves draft) */}
          {saveError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" aria-hidden="true" />
                <span>{saveError}</span>
              </div>
              {lastFailedAction && (
                <button
                  type="button"
                  onClick={() => lastFailedAction()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-500 font-medium transition-colors"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* Balanced 2-Column Split Pane (~45% statement / ~55% workspace) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[calc(100vh-10.5rem)]">
            {/* Left Pane (45% -> 5 of 12 columns): Question Statement */}
            <section
              aria-label="Problem statement"
              className="lg:col-span-5 flex flex-col rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-[#27272A]">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {headline}
                </h1>
                {Array.isArray(question.subtopicIDs) && question.subtopicIDs.length > 0 && (
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Subtopics:{' '}
                    {question.subtopicIDs.map((s) => s?.name).filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              <div className="p-5 flex-1 overflow-y-auto" data-lenis-prevent>
                <FormattedStatement text={bodyWithoutHeadline || question.statement} />
              </div>
            </section>

            {/* Right Pane (55% -> 7 of 12 columns): Coding or Theory Workspace */}
            <section
              aria-label="Solution workspace"
              className="lg:col-span-7 flex flex-col rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden"
            >
              {question.type === 'Coding' ? (
                <>
                  {/* Editor Toolbar */}
                  <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#141418]">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                      <span>solution.py</span>
                      <span aria-hidden="true" className="text-zinc-400">
                        ·
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">Draft auto-saved</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetTemplate}
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      <span>Reset stub</span>
                    </button>
                  </div>

                  {/* Monaco Python Editor */}
                  <div className="flex-1 min-h-[280px] border-b border-zinc-200 dark:border-[#27272A]">
                    <PythonEditor value={content} onChange={handleCodeChange} theme={theme} />
                  </div>

                  {/* Tabbed Test Cases / Execution Output Console */}
                  <div className="flex flex-col h-[240px]">
                    <div className="px-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#141418]">
                      <div className="flex items-center gap-4" role="tablist" aria-label="Console tabs">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={consoleTab === 'cases'}
                          onClick={() => setConsoleTab('cases')}
                          className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                            consoleTab === 'cases'
                              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          Test Cases ({visibleTestCases.length})
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={consoleTab === 'output'}
                          onClick={() => setConsoleTab('output')}
                          className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                            consoleTab === 'output'
                              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          Execution Output
                        </button>
                      </div>

                      {hiddenTestCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          <span>
                            +{hiddenTestCount} hidden {hiddenTestCount === 1 ? 'case' : 'cases'}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 text-xs" data-lenis-prevent>
                      {consoleTab === 'cases' ? (
                        <div className="space-y-3">
                          {visibleTestCases.length === 0 ? (
                            <p className="text-zinc-500 dark:text-zinc-400">
                              No public test cases listed. Hidden sandbox checks run on submit.
                            </p>
                          ) : (
                            visibleTestCases.map((tc, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#0B0B0E] p-3 space-y-1.5 font-mono"
                              >
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  Case {idx + 1}
                                </div>
                                <div>
                                  <span className="text-zinc-500 dark:text-zinc-400">Input: </span>
                                  <span className="text-zinc-900 dark:text-zinc-100">{tc.input}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 dark:text-zinc-400">
                                    Expected:{' '}
                                  </span>
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    {tc.expectedOutput}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : !executionSummary ? (
                        <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                          Click &ldquo;Run&rdquo; or &ldquo;Submit&rdquo; to run your Python
                          solution.
                        </div>
                      ) : executionSummary.hasError ? (
                        <div className="space-y-3 font-mono">
                          <div className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Failed</span>
                          </div>
                          <pre
                            data-testid="execution-error"
                            className="pt-3 border-t border-zinc-200 dark:border-[#27272A] text-xs leading-relaxed text-rose-600 dark:text-rose-400 whitespace-pre-wrap break-words"
                          >
                            {executionSummary.errorMessage}
                          </pre>
                        </div>
                      ) : (
                        <div className="space-y-3 font-mono">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                              <CheckCircle2
                                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                                aria-hidden="true"
                              />
                              <span>Code successfully executed.</span>
                            </div>

                            {executionSummary.allPassed ? (
                              <span className="inline-flex items-center gap-1.5 font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>
                                  {executionSummary.totalCount > 0
                                    ? `Passed · ${executionSummary.passedCount}/${executionSummary.totalCount} tests`
                                    : 'Passed'}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-medium tabular-nums text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>
                                  {executionSummary.totalCount > 0
                                    ? `Failed · ${executionSummary.passedCount}/${executionSummary.totalCount} tests passed`
                                    : 'Failed'}
                                </span>
                              </span>
                            )}
                          </div>

                          {executionSummary.hasPrintedOutput && (
                            <div className="pt-3 border-t border-zinc-200 dark:border-[#27272A] space-y-1.5">
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Output
                              </div>
                              <pre
                                data-testid="execution-stdout"
                                className="text-xs leading-relaxed text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words"
                              >
                                {executionSummary.printedOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Theory Structured Editor & Side-by-Side Model Answer Self-Assessment */
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#141418]">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                      <span>{theoryRevealed ? 'Self-Assessment Review' : 'Structured Response'}</span>
                      <span aria-hidden="true" className="text-zinc-400">
                        ·
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {content.trim().length} chars
                      </span>
                    </div>
                    {theoryRevealed ? (
                      <button
                        type="button"
                        onClick={() => setTheoryRevealed(false)}
                        className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Edit answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResetTemplate}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {!theoryRevealed ? (
                    <div className="flex-1 flex flex-col p-4">
                      <label htmlFor="theory-response" className="sr-only">
                        Your conceptual answer
                      </label>
                      <textarea
                        id="theory-response"
                        value={content}
                        onChange={(e) => {
                          setContent(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="Structure your explanation clearly: core mechanism, invariants/edge cases, and engineering trade-offs (Markdown supported)..."
                        className="flex-1 w-full min-h-[340px] p-4 rounded-md text-sm leading-relaxed bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 resize-none"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div
                        className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-[#27272A] overflow-y-auto"
                        data-lenis-prevent
                      >
                        <div className="p-4 space-y-2.5">
                          <div className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
                            Your Response
                          </div>
                          <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                            {content}
                          </div>
                        </div>

                        <div className="p-4 space-y-2.5 bg-zinc-50/50 dark:bg-[#0D0D10]">
                          <div className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            Model Answer
                          </div>
                          <FormattedStatement
                            text={question.modelAnswer || 'No model answer provided.'}
                          />
                        </div>
                      </div>

                      {/* Explicit Self-Assessment Prompt */}
                      <div className="p-4 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#141418]">
                        {theorySavedStatus ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs">
                              <StatusBadge status={theorySavedStatus.status} />
                              <span className="text-zinc-700 dark:text-zinc-300">
                                {theorySavedStatus.message}
                              </span>
                            </div>
                            <Link
                              to="/recovery-plan"
                              className="text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
                            >
                              Return to Recovery Plan &rarr;
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-xs text-zinc-700 dark:text-zinc-300">
                              Compare your explanation with the model answer and grade honestly:
                            </p>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleTheorySelfAssess('Solved')}
                                className="px-3.5 py-2 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap disabled:opacity-50"
                              >
                                Mark as Solved
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleTheorySelfAssess('Attempted')}
                                className="px-3.5 py-2 rounded-md text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors whitespace-nowrap disabled:opacity-50"
                              >
                                Needs Practice (Attempted)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Error & Action Bar */}
              {!(question.type === 'Theory' && theorySavedStatus) && (
                <div className="px-4 py-3 border-t border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] space-y-2.5">
                  {validationError && (
                    <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                      {validationError}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSkipModalOpen(true)}
                      disabled={submitting || skipping}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181B] hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
                    >
                      <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Skip</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      {question.type === 'Coding' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => executeCodingAttempt('run')}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium border border-zinc-300 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            <Play className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{activeAction === 'run' ? 'Running...' : 'Run'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCodingAttempt('submit')}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {activeAction === 'submit'
                                ? 'Evaluating...'
                                : isSubmitted
                                ? 'Submitted'
                                : 'Submit'}
                            </span>
                          </button>
                        </>
                      ) : !theoryRevealed ? (
                        <button
                          type="button"
                          onClick={handleTheoryReveal}
                          disabled={submitting}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Submit &amp; Compare Model Answer</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={skipModalOpen}
        title="Skip this question?"
        description="This records a Skipped attempt in your diagnostic history and returns you to your Daily Recovery Plan. Your draft remains saved in this browser."
        confirmLabel="Skip question"
        cancelLabel="Keep working"
        variant="danger"
        loading={skipping}
        onConfirm={handleConfirmSkip}
        onCancel={() => setSkipModalOpen(false)}
      />

      <ModeTransitionModal
        isOpen={transitionModalOpen && Boolean(pendingTransition)}
        transition={pendingTransition}
        loading={advancingMode}
        error={transitionError}
        onConfirm={handleConfirmNextMode}
        onCancel={() => setTransitionModalOpen(false)}
      />
    </AppShell>
  );
}

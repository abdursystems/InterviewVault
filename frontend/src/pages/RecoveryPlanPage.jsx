import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Info, Stethoscope } from 'lucide-react';
import AppShell from '../components/AppShell';
import { DifficultyBadge, ModeBadge, RoleBadge, StatusBadge } from '../components/Badge';
import ModeTransitionModal from '../components/ModeTransitionModal';
import { PlanSkeleton } from '../components/Skeleton';
import { recoveryPlanAPI, getApiErrorMessage } from '../services/api';
import { computePlanProgress, extractQuestionHeadline } from '../utils/diagnostics';

export default function RecoveryPlanPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [advancingMode, setAdvancingMode] = useState(false);
  const [transitionError, setTransitionError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await recoveryPlanAPI.getRecoveryPlan();
        if (active) {
          setPayload(data);
          if (data?.pendingTransition) {
            setTransitionModalOpen(true);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            getApiErrorMessage(err, 'Failed to load today’s recovery plan. Please try again.')
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
  }, []);

  const plan = payload?.plan || null;
  const notice = payload?.notice || null;
  const pendingTransition = payload?.pendingTransition || null;
  const items = Array.isArray(plan?.items) ? plan.items : [];
  const diagnosedName = plan?.diagnosedSubtopicID?.name || null;
  const progress = computePlanProgress(plan);

  const handleConfirmNextMode = async () => {
    setAdvancingMode(true);
    setTransitionError('');
    try {
      const nextPayload = await recoveryPlanAPI.advanceRecoveryMode(plan);
      setPayload(nextPayload);
      setTransitionModalOpen(false);
    } catch (err) {
      setTransitionError(
        getApiErrorMessage(err, 'Unable to advance to the next mode. Please try again.')
      );
    } finally {
      setAdvancingMode(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-[#27272A]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <ModeBadge mode={plan?.mode || 'Onboarding'} />
              {plan?.date && (
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {plan.date}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Daily Recovery Plan
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {diagnosedName ? (
                <>
                  Anchored on diagnosed subtopic{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {diagnosedName}
                  </span>{' '}
                  with 2 Focus, 1 Retry, 1 Review, and 1 Stretch drill.
                </>
              ) : (
                'A personalized 5-question practice set tailored to what you need to work on.'
              )}
            </p>
          </div>

          {!loading && !error && (
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="sm:text-right">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Queue Progress</div>
                <div className="mt-0.5 text-lg font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {progress.completed}/{progress.total} Completed
                </div>
              </div>
              {pendingTransition && (
                <button
                  type="button"
                  onClick={() => {
                    setTransitionError('');
                    setTransitionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap"
                >
                  <span>Continue to Next Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notice Banner (when present in Onboarding or GeneralPractice modes) */}
        {!loading && notice && (
          <div
            role="status"
            className="flex items-start gap-3 p-4 rounded-lg border border-sky-500/25 bg-sky-500/10 text-xs sm:text-sm text-sky-900 dark:text-sky-200"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}

        {loading ? (
          <PlanSkeleton />
        ) : error ? (
          <div
            role="alert"
            className="flex items-start gap-3 p-5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-sm text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-10 text-center">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No recovery items scheduled for today
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              Explore Problems to record additional attempts and generate your next plan.
            </p>
            <Link
              to="/questions"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
            >
              <span>Browse Problems</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ol className="space-y-4">
            {items.map((item, idx) => {
              const q = item.questionID;
              if (!q) return null;
              const headline = extractQuestionHeadline(q.statement);
              const subtopicNames = Array.isArray(q.subtopicIDs)
                ? q.subtopicIDs.map((s) => s?.name).filter(Boolean).join(' / ')
                : '';

              return (
                <li
                  key={`${q._id}-${item.role}-${idx}`}
                  className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                          0{idx + 1}
                        </span>
                        <RoleBadge role={item.role} />
                        <DifficultyBadge difficulty={q.difficulty} />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {q.type}
                        </span>
                        <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                          ·
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {q.topicID?.name}
                          {subtopicNames ? ` / ${subtopicNames}` : ''}
                        </span>
                      </div>

                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {headline}
                      </h2>

                      {/* Highlighted Diagnostic Rationale Callout Bar */}
                      <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-md bg-zinc-50 dark:bg-[#16161A] border border-zinc-200/90 dark:border-[#27272A]">
                        <Stethoscope
                          className="w-3.5 h-3.5 mt-0.5 text-zinc-500 dark:text-zinc-400 shrink-0"
                          aria-hidden="true"
                        />
                        <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {item.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0">
                      <StatusBadge status={item.state} />
                      <Link
                        to={`/questions/${q._id}`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          item.state === 'Completed'
                            ? 'border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B]'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white'
                        }`}
                      >
                        <span>{item.state === 'Completed' ? 'Review Again' : 'Solve Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, BookOpen, Compass } from 'lucide-react';
import AppShell from '../components/AppShell';
import { ModeBadge } from '../components/Badge';
import { DashboardSkeleton } from '../components/Skeleton';
import { attemptsAPI, recoveryPlanAPI, getApiErrorMessage } from '../services/api';
import {
  computePlanProgress,
  formatShortDate,
  normalizeAccuracy,
  sortSubtopicsByWeakness,
} from '../utils/diagnostics';

function AccuracyRing({ value }) {
  const clamped = normalizeAccuracy(value);
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeClass =
    clamped >= 70
      ? 'stroke-emerald-500'
      : clamped >= 45
        ? 'stroke-amber-500'
        : 'stroke-rose-500';

  return (
    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          className="stroke-zinc-200 dark:stroke-[#27272A]"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={strokeClass}
        />
      </svg>
      <span className="absolute text-[11px] font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {clamped}%
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [planPayload, setPlanPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [dashData, planData] = await Promise.all([
          attemptsAPI.getDashboard(),
          recoveryPlanAPI.getRecoveryPlan(),
        ]);
        if (active) {
          setDashboard(dashData);
          setPlanPayload(planData);
        }
      } catch (err) {
        if (active) {
          setError(
            getApiErrorMessage(
              err,
              'Could not load diagnostic dashboard data. Please try refreshing.'
            )
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

  const plan = planPayload?.plan || null;
  const notice = planPayload?.notice || null;
  const diagnosedName = plan?.diagnosedSubtopicID?.name || null;
  const progress = computePlanProgress(plan);
  const topicStats = Array.isArray(dashboard?.topicStats) ? dashboard.topicStats : [];
  const subtopicStats = sortSubtopicsByWeakness(dashboard?.subtopicStats);

  const renderHeroHeadline = () => {
    if (diagnosedName) {
      return `Root Cause Detected: ${diagnosedName}`;
    }
    if (plan?.mode === 'GeneralPractice') {
      return 'General Practice Mode';
    }
    return 'Onboarding Mode — Complete 5 attempts to unlock Root-Cause Diagnosis';
  };

  const renderHeroSubcopy = () => {
    if (diagnosedName) {
      return `Today's deterministic recovery plan prioritizes ${diagnosedName} alongside targeted retry, review, and stretch drills.`;
    }
    if (notice) {
      return notice;
    }
    if (plan?.mode === 'GeneralPractice') {
      return 'Your practiced subtopics meet target accuracy. Complete today’s balanced practice queue to preserve retention.';
    }
    return 'Attempt 5 questions across DSA, OOP, DBMS, and OS so the diagnostic engine can isolate your weakest subtopic.';
  };

  return (
    <AppShell>
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-5 flex items-start gap-3 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" aria-hidden="true" />
          <div>
            <div className="font-medium">Unable to load dashboard</div>
            <p className="mt-1 text-xs opacity-90">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Hero Banner: Today's Root-Cause Diagnosis & Recovery Progress */}
          <section
            aria-label="Daily diagnostic summary"
            className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 sm:p-7"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <ModeBadge mode={plan?.mode || 'Onboarding'} />
                  {plan?.date && (
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                      Plan Date · {plan.date}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 [text-wrap:balance]">
                  {renderHeroHeadline()}
                </h1>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {renderHeroSubcopy()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-4 shrink-0 lg:min-w-[260px]">
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Today&apos;s Progress</span>
                    <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      {progress.completed}/{progress.total || 5} Completed
                    </span>
                  </div>
                  <div
                    className="h-2 w-full rounded-full bg-zinc-200 dark:bg-[#27272A] overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progress.completed}
                    aria-valuemin={0}
                    aria-valuemax={progress.total || 5}
                    aria-label="Daily recovery plan completion"
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>

                <Link
                  to="/recovery-plan"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Open Recovery Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* Per-Topic Mastery Grid */}
          <section aria-labelledby="topic-mastery-heading" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <h2
                  id="topic-mastery-heading"
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Topic Mastery
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Accuracy across core computer science interview domains
                </p>
              </div>
              <Link
                to="/questions"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Browse Problems &rarr;
              </Link>
            </div>

            {topicStats.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-8 text-center">
                <Compass
                  className="w-7 h-7 mx-auto text-zinc-400 dark:text-zinc-500"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  No diagnostic telemetry recorded yet
                </h3>
                <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Complete your first questions in DSA, OOP, DBMS, or OS to populate per-topic
                  accuracy rings and unlock subtopic weakness tracking.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <Link
                    to="/recovery-plan"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
                  >
                    <span>Start Onboarding Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/questions"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Explore Questions</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topicStats.map((topic, idx) => {
                  const solved = Number(topic?.solved) || 0;
                  const attempted = Number(topic?.attempted) || 0;
                  const skipped = Number(topic?.skipped) || 0;
                  const totalAttempts = solved + attempted + skipped;
                  return (
                    <div
                      key={topic?.topicID || topic?.topicName || idx}
                      className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-[border-color]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {topic?.topicName || 'Domain'}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                            {totalAttempts} total attempts
                          </p>
                        </div>
                        <AccuracyRing value={topic?.accuracy} />
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-zinc-200 dark:border-[#27272A] grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {solved}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Solved</div>
                        </div>
                        <div>
                          <div className="text-xs font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                            {attempted}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Attempted
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-mono font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                            {skipped}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Skipped</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Subtopic Weakness Breakdown Table */}
          <section aria-labelledby="subtopic-weakness-heading" className="space-y-4">
            <div>
              <h2
                id="subtopic-weakness-heading"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Subtopic Weakness Index
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ordered from lowest accuracy to highest so bottlenecks surface immediately
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden">
              {subtopicStats.length === 0 ? (
                <div className="px-6 py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Subtopic accuracy rows will appear here after your first recorded attempt.
                </div>
              ) : (
                <div className="overflow-x-auto" data-lenis-prevent>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-[#27272A] text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-[#141418]">
                        <th className="py-3 px-5">Subtopic</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4 text-right">Solved</th>
                        <th className="py-3 px-4 text-right">Attempted</th>
                        <th className="py-3 px-4 text-right">Skipped</th>
                        <th className="py-3 px-4 text-right">Accuracy</th>
                        <th className="py-3 px-4 text-right">Last Practiced</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A] text-sm">
                      {subtopicStats.map((row) => {
                        const isRootCause =
                          diagnosedName && row.subtopicName === diagnosedName;
                        const barColor =
                          row.accuracy >= 70
                            ? 'bg-emerald-500'
                            : row.accuracy >= 45
                              ? 'bg-amber-500'
                              : 'bg-rose-500';
                        return (
                          <tr
                            key={row.subtopicID}
                            className="hover:bg-zinc-50 dark:hover:bg-[#18181B] transition-colors"
                          >
                            <td className="py-3 px-5 font-medium text-zinc-900 dark:text-zinc-100">
                              <div className="flex items-center gap-2">
                                <span>{row.subtopicName}</span>
                                {isRootCause && (
                                  <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                                    · Root Cause
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                              {row.topicName}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                              {row.solved}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-amber-600 dark:text-amber-400">
                              {row.attempted}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                              {row.skipped}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center justify-end gap-2.5">
                                <div className="hidden sm:block w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-[#27272A] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${row.accuracy}%` }}
                                  />
                                </div>
                                <span className="font-mono text-xs font-medium tabular-nums text-zinc-900 dark:text-zinc-100 w-9 text-right">
                                  {row.accuracy}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                              {formatShortDate(row.lastPracticed)}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <Link
                                to={`/questions?subtopicID=${encodeURIComponent(row.subtopicID)}`}
                                className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-current transition-colors whitespace-nowrap"
                              >
                                Drill
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

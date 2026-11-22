import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, RotateCcw, Search, Clock } from 'lucide-react';
import AppShell from '../components/AppShell';
import { DifficultyBadge, StatusBadge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';
import { attemptsAPI, getApiErrorMessage } from '../services/api';
import {
  extractQuestionHeadline,
  formatDurationHuman,
  formatTimestamp,
} from '../utils/diagnostics';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await attemptsAPI.getHistory();
        if (active) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(
            getApiErrorMessage(
              err,
              'Could not fetch attempt history. Please refresh and try again.'
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

  const topics = useMemo(() => {
    const names = new Set();
    for (const item of history) {
      if (item?.questionID?.topicID?.name) {
        names.add(item.questionID.topicID.name);
      }
    }
    return Array.from(names).sort();
  }, [history]);

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    return history.filter((att) => {
      if (statusFilter && att.status !== statusFilter) return false;
      if (topicFilter && att.questionID?.topicID?.name !== topicFilter) return false;
      if (term) {
        const statement = (att.questionID?.statement || '').toLowerCase();
        const topic = (att.questionID?.topicID?.name || '').toLowerCase();
        const subs = (att.questionID?.subtopicIDs || [])
          .map((s) => (s?.name || '').toLowerCase())
          .join(' ');
        if (!statement.includes(term) && !topic.includes(term) && !subs.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [history, statusFilter, topicFilter, search]);

  const summary = useMemo(() => {
    const solved = history.filter((h) => h.status === 'Solved').length;
    const attempted = history.filter((h) => h.status === 'Attempted').length;
    const skipped = history.filter((h) => h.status === 'Skipped').length;
    return { solved, attempted, skipped, total: history.length };
  }, [history]);

  const hasFilters = Boolean(statusFilter || topicFilter || search.trim());

  const resetFilters = () => {
    setStatusFilter('');
    setTopicFilter('');
    setSearch('');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Attempt History
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Chronological log of all coding executions, theory self-assessments, and skipped items.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
              <span>{summary.total} total</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 dark:text-emerald-400">{summary.solved} solved</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-600 dark:text-amber-400">
                {summary.attempted} attempted
              </span>
              <span aria-hidden="true">·</span>
              <span>{summary.skipped} skipped</span>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <section
          aria-label="Filter attempt history"
          className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <label htmlFor="hist-search" className="sr-only">
              Search attempt history
            </label>
            <Search
              className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="hist-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by question, topic, or subtopic..."
              className="w-full pl-9 pr-3 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="hist-status" className="sr-only">
              Status
            </label>
            <select
              id="hist-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
            >
              <option value="">All Statuses</option>
              <option value="Solved">Solved</option>
              <option value="Attempted">Attempted</option>
              <option value="Skipped">Skipped</option>
            </select>

            <label htmlFor="hist-topic" className="sr-only">
              Topic
            </label>
            <select
              id="hist-topic"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-3 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </section>

        {/* History Table */}
        <section
          aria-label="Attempt timeline"
          className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden"
        >
          {loading ? (
            <TableSkeleton rows={7} />
          ) : error ? (
            <div
              role="alert"
              className="p-6 flex items-start gap-3 text-sm text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="px-6 py-14 text-center space-y-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {history.length === 0
                  ? 'No attempts recorded yet'
                  : 'No attempts match the current filters'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {history.length === 0
                  ? 'Start practicing from your Daily Recovery Plan or Problems.'
                  : 'Clear filters to view your complete attempt log.'}
              </p>
              <div className="pt-2">
                {history.length === 0 ? (
                  <Link
                    to="/questions"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
                  >
                    <span>Browse Problems</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-3.5 py-1.5 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto" data-lenis-prevent>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-[#27272A] text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-[#141418]">
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-4">Question</th>
                    <th className="py-3 px-4">Topic &amp; Subtopics</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A] text-sm">
                  {filteredHistory.map((att) => {
                    const q = att.questionID;
                    const headline = extractQuestionHeadline(q?.statement);
                    return (
                      <tr
                        key={att._id}
                        className="group hover:bg-zinc-50 dark:hover:bg-[#18181B] transition-colors"
                      >
                        <td className="py-3.5 px-5 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {formatTimestamp(att.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          {q?._id ? (
                            <Link
                              to={`/questions/${q._id}`}
                              className="inline-flex items-center gap-1 font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline underline-offset-4 decoration-zinc-400 dark:decoration-zinc-600"
                            >
                              <span className="line-clamp-1">{headline}</span>
                              <ArrowUpRight
                                className="w-3.5 h-3.5 shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-hidden="true"
                              />
                            </Link>
                          ) : (
                            <span className="italic text-zinc-500 dark:text-zinc-400">
                              Deleted Question
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                            {q?.topicID?.name || '—'}
                          </span>
                          {Array.isArray(q?.subtopicIDs) && q.subtopicIDs.length > 0 && (
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {' '}
                              · {q.subtopicIDs.map((s) => s?.name).filter(Boolean).join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {q?.difficulty ? (
                            <DifficultyBadge difficulty={q.difficulty} />
                          ) : (
                            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={att.status} />
                        </td>
                        <td className="py-3.5 px-5 text-right text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          <span className="inline-flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                            <span>{formatDurationHuman(att.timeTakenSeconds)}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

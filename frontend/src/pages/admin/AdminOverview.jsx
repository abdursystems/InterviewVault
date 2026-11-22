import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCode2,
  Tags,
  Users,
  Archive,
  Plus,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import { extractTopicId } from '../../utils/diagnostics';

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    activeQuestionsTotal: 0,
    archivedQuestionsTotal: 0,
    activeQuestionsSample: [],
    topics: [],
    subtopics: [],
    users: [],
  });

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const [activePage, archivedPage, activeBatch, topics, subtopics, users] = await Promise.all([
        adminAPI.getQuestions({ limit: 1, archived: 'false' }),
        adminAPI.getQuestions({ limit: 1, archived: 'true' }),
        adminAPI.getQuestions({ limit: 100, archived: 'false' }),
        adminAPI.getTopics(),
        adminAPI.getSubtopics(),
        adminAPI.getUsers(),
      ]);

      setData({
        activeQuestionsTotal: activePage?.total ?? 0,
        archivedQuestionsTotal: archivedPage?.total ?? 0,
        activeQuestionsSample: activeBatch?.items || [],
        topics: Array.isArray(topics) ? topics : [],
        subtopics: Array.isArray(subtopics) ? subtopics : [],
        users: Array.isArray(users) ? users : [],
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load admin overview metrics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const userCounts = useMemo(() => {
    const total = data.users.length;
    const active = data.users.filter((u) => u.isActive !== false).length;
    const admins = data.users.filter((u) => u.role === 'Admin').length;
    return { total, active, disabled: total - active, admins };
  }, [data.users]);

  const topicBreakdown = useMemo(() => {
    return data.topics.map((topic) => {
      const topicSubs = data.subtopics.filter((s) => extractTopicId(s.topicID) === topic._id);
      const topicQs = data.activeQuestionsSample.filter(
        (q) => extractTopicId(q.topicID) === topic._id
      );
      const codingCount = topicQs.filter((q) => q.type === 'Coding').length;
      const theoryCount = topicQs.filter((q) => q.type === 'Theory').length;
      return {
        _id: topic._id,
        name: topic.name,
        subtopicCount: topicSubs.length,
        questionCount: topicQs.length,
        codingCount,
        theoryCount,
      };
    });
  }, [data.topics, data.subtopics, data.activeQuestionsSample]);

  const maxTopicQuestions = Math.max(1, ...topicBreakdown.map((t) => t.questionCount));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Content & Platform Governance
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
            Administration Overview
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Live inventory of question bank coverage, subtopic taxonomy, and registered user
            accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4 space-y-3"
            >
              <div className="h-3 w-24 rounded skeleton-shimmer" />
              <div className="h-7 w-16 rounded skeleton-shimmer" />
              <div className="h-3 w-32 rounded skeleton-shimmer" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Active Questions</span>
                <FileCode2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {data.activeQuestionsTotal}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Live in student practice bank
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Archived Questions</span>
                <Archive className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {data.archivedQuestionsTotal}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Preserved for historical integrity
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Total Subtopics</span>
                <Tags className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {data.subtopics.length}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Across {data.topics.length} fixed CS topics
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Registered Users</span>
                <Users className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {userCounts.total}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                {userCounts.active} active · {userCounts.disabled} disabled
              </p>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Link
            to="/admin/questions?new=1"
            className="group rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  + New Question
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Author a Theory rubric or Python Coding question with test cases.
                </p>
              </div>
            </div>
            <ArrowUpRight
              className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 shrink-0 transition-colors"
              aria-hidden="true"
            />
          </Link>

          <Link
            to="/admin/subtopics?new=1"
            className="group rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0">
                <Tags className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  + New Subtopic
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Extend diagnostic taxonomy under DBMS, DSA, OOP, or OS.
                </p>
              </div>
            </div>
            <ArrowUpRight
              className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 shrink-0 transition-colors"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      {/* Topic Coverage Breakdown */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Core CS Topic Distribution
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Active question inventory and subtopic depth across the 4 canonical subjects.
            </p>
          </div>
          <Link
            to="/admin/questions"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
          >
            <span>Manage Bank</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto" data-lenis-prevent>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#141418] text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-2.5 px-5 font-medium">Topic</th>
                <th className="py-2.5 px-4 font-medium text-right">Subtopics</th>
                <th className="py-2.5 px-4 font-medium text-right">Coding</th>
                <th className="py-2.5 px-4 font-medium text-right">Theory</th>
                <th className="py-2.5 px-4 font-medium text-right">Active Total</th>
                <th className="py-2.5 px-5 font-medium w-48">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A] text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3.5 px-5">
                      <div className="h-4 w-full rounded skeleton-shimmer" />
                    </td>
                  </tr>
                ))
              ) : (
                topicBreakdown.map((row) => {
                  const pct = Math.round((row.questionCount / maxTopicQuestions) * 100);
                  return (
                    <tr
                      key={row._id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-[#18181B]/60 transition-colors"
                    >
                      <td className="py-3 px-5">
                        <Link
                          to={`/admin/questions?topicID=${encodeURIComponent(row._id)}`}
                          className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                        {row.subtopicCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                        {row.codingCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                        {row.theoryCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {row.questionCount}
                      </td>
                      <td className="py-3 px-5">
                        <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-[#27272A] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-200 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

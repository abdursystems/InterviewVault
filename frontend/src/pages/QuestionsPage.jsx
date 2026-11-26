import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, AlertCircle, Code2, FileText, ArrowUpRight } from 'lucide-react';
import AppShell from '../components/AppShell';
import { DifficultyBadge, StatusBadge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';
import { attemptsAPI, questionsAPI, getApiErrorMessage } from '../services/api';
import {
  buildLatestStatusMap,
  extractQuestionHeadline,
  extractTopicId,
  filterQuestions,
} from '../utils/diagnostics';

export default function QuestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [taxonomy, setTaxonomy] = useState({ topics: [], subtopics: [] });
  const [allQuestions, setAllQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [topicID, setTopicID] = useState('');
  const [subtopicID, setSubtopicID] = useState(() => searchParams.get('subtopicID') || '');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [taxData, qData, histData] = await Promise.all([
          questionsAPI.getTaxonomy(),
          questionsAPI.getQuestions({}, { signal: controller.signal }),
          attemptsAPI.getHistory(),
        ]);
        if (active && !controller.signal.aborted) {
          setTaxonomy(taxData || { topics: [], subtopics: [] });
          setAllQuestions(Array.isArray(qData) ? qData : []);
          setHistory(Array.isArray(histData) ? histData : []);
        }
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
          return;
        }
        if (active) {
          setError(
            getApiErrorMessage(err, 'Unable to load problems. Please refresh and try again.')
          );
        }
      } finally {
        if (active && !controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  // Sync URL ?subtopicID=... to parent topicID once taxonomy is loaded
  useEffect(() => {
    const urlSub = searchParams.get('subtopicID') || '';
    if (!urlSub || !Array.isArray(taxonomy.subtopics) || taxonomy.subtopics.length === 0) return;
    setSubtopicID(urlSub);
    const matchedSub = taxonomy.subtopics.find((s) => s._id === urlSub);
    const matchedTopicId = extractTopicId(matchedSub?.topicID);
    if (matchedTopicId) {
      setTopicID(matchedTopicId);
    }
  }, [searchParams, taxonomy.subtopics]);

  const statusMap = useMemo(() => buildLatestStatusMap(history), [history]);

  const availableSubtopics = useMemo(() => {
    if (!topicID) return taxonomy.subtopics;
    return taxonomy.subtopics.filter((s) => extractTopicId(s.topicID) === topicID);
  }, [taxonomy.subtopics, topicID]);

  const filteredQuestions = useMemo(
    () =>
      filterQuestions(
        allQuestions,
        { search, topicID, subtopicID, difficulty, type, status },
        statusMap
      ),
    [allQuestions, search, topicID, subtopicID, difficulty, type, status, statusMap]
  );

  const hasActiveFilters = Boolean(
    search.trim() || topicID || subtopicID || difficulty || type || status
  );

  const handleTopicChange = (nextTopicId) => {
    setTopicID(nextTopicId);
    if (subtopicID) {
      const stillValid = taxonomy.subtopics.some(
        (s) => s._id === subtopicID && (!nextTopicId || extractTopicId(s.topicID) === nextTopicId)
      );
      if (!stillValid) {
        setSubtopicID('');
      }
    }
  };

  const handleReset = () => {
    setSearch('');
    setTopicID('');
    setSubtopicID('');
    setDifficulty('');
    setType('');
    setStatus('');
    if (searchParams.has('subtopicID')) {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Problems
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Filter Python coding challenges and CS theory prompts across DSA, OOP, DBMS, and OS.
            </p>
          </div>
          {!loading && !error && (
            <div className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              Showing {filteredQuestions.length} of {allQuestions.length} questions
            </div>
          )}
        </div>

        {/* Sticky Filter Toolbar (sticky on md+ to preserve mobile viewport) */}
        <section
          aria-label="Filter questions"
          className="md:sticky md:top-14 md:z-20 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white/95 dark:bg-[#111114]/95 backdrop-blur-sm p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Keyword Search */}
            <div className="sm:col-span-2 lg:col-span-4 relative">
              <label htmlFor="q-search" className="sr-only">
                Search questions
              </label>
              <Search
                className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="q-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search statements, topics, subtopics..."
                className="w-full pl-9 pr-3 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
              />
            </div>

            {/* Topic Dropdown */}
            <div className="lg:col-span-2">
              <label htmlFor="q-topic" className="sr-only">
                Topic
              </label>
              <select
                id="q-topic"
                value={topicID}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              >
                <option value="">All Topics</option>
                {taxonomy.topics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cascading Subtopic Dropdown */}
            <div className="lg:col-span-2">
              <label htmlFor="q-subtopic" className="sr-only">
                Subtopic
              </label>
              <select
                id="q-subtopic"
                value={subtopicID}
                onChange={(e) => setSubtopicID(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              >
                <option value="">All Subtopics</option>
                {availableSubtopics.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="lg:col-span-1">
              <label htmlFor="q-difficulty" className="sr-only">
                Difficulty
              </label>
              <select
                id="q-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              >
                <option value="">Diff.</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Type */}
            <div className="lg:col-span-1">
              <label htmlFor="q-type" className="sr-only">
                Type
              </label>
              <select
                id="q-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              >
                <option value="">Type</option>
                <option value="Coding">Coding</option>
                <option value="Theory">Theory</option>
              </select>
            </div>

            {/* Status */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <label htmlFor="q-status" className="sr-only">
                Status
              </label>
              <select
                id="q-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md text-xs bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              >
                <option value="">All Status</option>
                <option value="Solved">Solved</option>
                <option value="Attempted">Attempted</option>
                <option value="Skipped">Skipped</option>
                <option value="Unattempted">Unattempted</option>
              </select>

              <button
                type="button"
                onClick={handleReset}
                disabled={!hasActiveFilters}
                aria-label="Reset filters"
                title="Reset filters"
                className="px-2.5 py-2 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Reset</span>
              </button>
            </div>
          </div>
        </section>

        {/* Questions Table */}
        <section
          aria-label="Question list"
          className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden"
        >
          {loading ? (
            <TableSkeleton rows={8} />
          ) : error ? (
            <div
              role="alert"
              className="p-6 flex items-start gap-3 text-sm text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No questions found
              </p>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Try broadening your search keyword or clearing active filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 px-3.5 py-1.5 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto" data-lenis-prevent>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-[#27272A] text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-[#141418]">
                    <th className="py-3 px-5">Question</th>
                    <th className="py-3 px-4">Domain &amp; Subtopics</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A] text-sm">
                  {filteredQuestions.map((q) => {
                    const userStatus = statusMap[q._id] || 'Unattempted';
                    const headline = extractQuestionHeadline(q.statement);
                    return (
                      <tr
                        key={q._id}
                        className="group hover:bg-zinc-50 dark:hover:bg-[#18181B] transition-colors"
                      >
                        <td className="py-3.5 px-5 max-w-md">
                          <Link
                            to={`/questions/${q._id}`}
state={{ from: `${location.pathname}${location.search}` }}
                            className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline underline-offset-4 decoration-zinc-400 dark:decoration-zinc-600 line-clamp-1"
                          >
                            {headline}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                              {q.topicID?.name}
                            </span>
                            {Array.isArray(q.subtopicIDs) && q.subtopicIDs.length > 0 && (
                              <>
                                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                                  ·
                                </span>
                                <span className="text-zinc-500 dark:text-zinc-400">
                                  {q.subtopicIDs.map((s) => s?.name).filter(Boolean).join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                            {q.type === 'Coding' ? (
                              <Code2 className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                            )}
                            <span>{q.type === 'Coding' ? 'Python' : 'Theory'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <DifficultyBadge difficulty={q.difficulty} />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={userStatus} />
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <Link
                            to={`/questions/${q._id}`}
state={{ from: `${location.pathname}${location.search}` }}
                            aria-label={`Open ${headline}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
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

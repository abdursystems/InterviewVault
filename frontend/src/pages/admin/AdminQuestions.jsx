import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Archive,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import { DifficultyBadge } from '../../components/Badge';
import { extractQuestionHeadline, extractTopicId } from '../../utils/diagnostics';
import QuestionFormModal from '../../components/admin/QuestionFormModal';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';
import { useAdminToast } from './AdminLayout';

const ARCHIVE_TABS = [
  { value: 'false', label: 'Active' },
  { value: 'true', label: 'Archived' },
  { value: '', label: 'All' },
];

export default function AdminQuestions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useAdminToast();

  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [topicID, setTopicID] = useState(() => searchParams.get('topicID') || '');
  const [subtopicID, setSubtopicID] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [archived, setArchived] = useState('false');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [restoringId, setRestoringId] = useState(null);

  // Honor ?new=1 quick action link
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingId(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Debounce keyword search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 220);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Load topics and subtopics taxonomy
  useEffect(() => {
    let active = true;
    Promise.all([adminAPI.getTopics(), adminAPI.getSubtopics()])
      .then(([tList, sList]) => {
        if (!active) return;
        setTopics(Array.isArray(tList) ? tList : []);
        setSubtopics(Array.isArray(sList) ? sList : []);
      })
      .catch(() => {
        // Error surfaced in main table call if auth/network fails
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleSubtopics = useMemo(() => {
    if (!topicID) return subtopics;
    return subtopics.filter((s) => extractTopicId(s.topicID) === topicID);
  }, [subtopics, topicID]);

  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchQuestions = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const reqId = ++requestIdRef.current;

    setLoading(true);
    setError('');
    try {
      const data = await adminAPI.getQuestions(
        {
          topicID: topicID || undefined,
          subtopicID: subtopicID || undefined,
          difficulty: difficulty || undefined,
          type: type || undefined,
          archived,
          q: debouncedSearch || undefined,
          page,
          limit: 20,
        },
        { signal: controller.signal }
      );
      if (reqId !== requestIdRef.current || controller.signal.aborted) return;
      setResult({
        items: Array.isArray(data?.items) ? data.items : [],
        total: data?.total ?? 0,
        page: data?.page ?? page,
        pages: data?.pages ?? 1,
      });
    } catch (err) {
      if (
        reqId !== requestIdRef.current ||
        controller.signal.aborted ||
        err?.code === 'ERR_CANCELED' ||
        err?.name === 'CanceledError' ||
        err?.name === 'AbortError'
      ) {
        return;
      }
      setError(getApiErrorMessage(err, 'Unable to fetch questions.'));
    } finally {
      if (reqId === requestIdRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [topicID, subtopicID, difficulty, type, archived, debouncedSearch, page]);

  useEffect(() => {
    fetchQuestions();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchQuestions]);

  const hasActiveFilters = Boolean(
    searchInput || topicID || subtopicID || difficulty || type || archived !== 'false'
  );

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTopicID('');
    setSubtopicID('');
    setDifficulty('');
    setType('');
    setArchived('false');
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (qId) => {
    setEditingId(qId);
    setFormOpen(true);
  };

  const handleQuestionSaved = (_saved, isEdit) => {
    addToast(
      isEdit ? 'Question updated successfully.' : 'New question added to the bank.',
      'success'
    );
    fetchQuestions();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await adminAPI.deleteQuestion(deleteTarget._id);
      if (res?.archived) {
        addToast(
          res.message || 'Question is in use, so it was archived instead of deleted',
          'warning'
        );
      } else {
        addToast('Question permanently deleted.', 'success');
      }
      setDeleteTarget(null);
      fetchQuestions();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Failed to delete or archive question.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (q) => {
    setRestoringId(q._id);
    try {
      await adminAPI.restoreQuestion(q._id);
      addToast('Question restored to active bank.', 'success');
      fetchQuestions();
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to restore question.'), 'error');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Question Bank CRUD
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
            Question Bank
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Author, edit, archive, and restore Theory and Python Coding questions across all 4 core
            topics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          data-testid="admin-add-question-btn"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search question statement, topic, or subtopic..."
              aria-label="Search questions"
              className="w-full h-9 pl-8.5 pr-8 rounded-md border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#09090B] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Archive Status Segmented Control */}
          <div
            role="group"
            aria-label="Archive status filter"
            className="inline-flex rounded-md border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#09090B] p-0.5 h-9 shrink-0"
          >
            {ARCHIVE_TABS.map((tab) => {
              const active = archived === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setArchived(tab.value);
                    setPage(1);
                  }}
                  className={`px-3 text-xs font-medium rounded transition-colors ${
                    active
                      ? 'bg-white dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2.5">
          <select
            value={topicID}
            onChange={(e) => {
              setTopicID(e.target.value);
              setSubtopicID('');
              setPage(1);
            }}
            aria-label="Filter by topic"
            className="h-8.5 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={subtopicID}
            onChange={(e) => {
              setSubtopicID(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by subtopic"
            className="h-8.5 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="">All Subtopics</option>
            {visibleSubtopics.map((s) => (
              <option key={s._id} value={s._id}>
                {topicID ? s.name : `${s.topicID?.name || ''} · ${s.name}`}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by difficulty"
            className="h-8.5 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by format"
            className="h-8.5 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="">All Formats</option>
            <option value="Coding">Coding (Python)</option>
            <option value="Theory">Theory</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
            >
              Reset filters
            </button>
          )}

          <div className="col-span-2 sm:col-span-4 lg:ml-auto text-[11px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
            {result.total} {result.total === 1 ? 'question' : 'questions'}
          </div>
        </div>
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

      {/* High-Density Paginated Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden">
        <div className="overflow-x-auto" data-lenis-prevent>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-[#27272A] bg-zinc-50/80 dark:bg-[#141418] text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-2.5 px-4 font-medium min-w-[280px]">Statement</th>
                <th className="py-2.5 px-3 font-medium">Topic</th>
                <th className="py-2.5 px-3 font-medium min-w-[160px]">Subtopics</th>
                <th className="py-2.5 px-3 font-medium">Difficulty</th>
                <th className="py-2.5 px-3 font-medium">Format</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#27272A] text-xs">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4">
                      <div className="h-4 w-full rounded skeleton-shimmer" />
                    </td>
                  </tr>
                ))
              ) : result.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      No matching questions found
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Adjust your active filters or create a new question for this topic.
                    </p>
                  </td>
                </tr>
              ) : (
                result.items.map((q) => {
                  const headline = extractQuestionHeadline(q.statement);
                  return (
                    <tr
                      key={q._id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-[#18181B]/60 transition-colors align-middle"
                    >
                      <td className="py-3 px-4 max-w-[380px]">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {headline}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {q.statement}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200">
                          {q.topicID?.name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(q.subtopicIDs || []).map((s, idx) => (
                            <span
                              key={s?._id || idx}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/80 dark:border-[#27272A]"
                            >
                              {s?.name || 'Subtopic'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <DifficultyBadge difficulty={q.difficulty} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                          {q.type === 'Coding' ? (
                            <Code2 className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                          )}
                          <span>{q.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {q.isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25">
                            <Archive className="w-3 h-3" aria-hidden="true" />
                            <span>Archived</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(q._id)}
                            title="Edit question"
                            aria-label={`Edit ${headline}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="hidden xl:inline">Edit</span>
                          </button>

                          {q.isArchived ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(q)}
                              disabled={restoringId === q._id}
                              title="Restore question"
                              aria-label={`Restore ${headline}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="hidden xl:inline">Restore</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError('');
                                setDeleteTarget(q);
                              }}
                              title="Delete or archive question"
                              aria-label={`Delete or archive ${headline}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="hidden xl:inline">Remove</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50/60 dark:bg-[#141418] flex items-center justify-between gap-4 text-xs">
          <span className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
            Page {result.page} of {result.pages} ({result.total} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(result.pages, p + 1))}
              disabled={page >= result.pages || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Question Modal */}
      <QuestionFormModal
        isOpen={formOpen}
        questionId={editingId}
        topics={topics}
        subtopics={subtopics}
        onClose={() => setFormOpen(false)}
        onSaved={handleQuestionSaved}
      />

      {/* Delete / Auto-Archive Confirmation Modal */}
      <ConfirmActionModal
        isOpen={Boolean(deleteTarget)}
        title="Remove question from active bank?"
        description="If this question has no recorded student attempts, it will be permanently deleted. If students have already attempted it, InterviewVault will safely archive it to preserve historical diagnostics."
        detail={deleteTarget ? extractQuestionHeadline(deleteTarget.statement) : ''}
        confirmLabel="Remove Question"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError('');
        }}
      />
    </div>
  );
}

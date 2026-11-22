import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Tags,
  Loader2,
} from 'lucide-react';
import { adminAPI, getApiErrorMessage } from '../../services/api';
import { extractTopicId } from '../../utils/diagnostics';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';
import { useAdminToast } from './AdminLayout';

export default function AdminSubtopics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useAdminToast();
  const nameInputRef = useRef(null);

  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [activeTopicFilter, setActiveTopicFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Create form state
  const [newTopicId, setNewTopicId] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Inline rename state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingRename, setSavingRename] = useState(false);
  const [renameError, setRenameError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchTaxonomy = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [tList, sList] = await Promise.all([adminAPI.getTopics(), adminAPI.getSubtopics()]);
      const safeTopics = Array.isArray(tList) ? tList : [];
      setTopics(safeTopics);
      setSubtopics(Array.isArray(sList) ? sList : []);
      setNewTopicId((prev) => prev || safeTopics[0]?._id || '');
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Unable to load subtopic taxonomy.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  // Honor ?new=1 quick action link by focusing the Add Subtopic input
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      window.setTimeout(() => nameInputRef.current?.focus(), 80);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const groupedTopics = useMemo(() => {
    const targetTopics = activeTopicFilter
      ? topics.filter((t) => t._id === activeTopicFilter)
      : topics;

    return targetTopics.map((topic) => ({
      topic,
      items: subtopics.filter((s) => extractTopicId(s.topicID) === topic._id),
    }));
  }, [topics, subtopics, activeTopicFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    const trimmed = newName.trim();
    if (!newTopicId) {
      setCreateError('Select a core topic.');
      return;
    }
    if (!trimmed) {
      setCreateError('Enter a subtopic name.');
      return;
    }

    setCreating(true);
    try {
      await adminAPI.createSubtopic({ topicID: newTopicId, name: trimmed });
      setNewName('');
      addToast(`Subtopic "${trimmed}" created.`, 'success');
      await fetchTaxonomy();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Unable to create subtopic.'));
    } finally {
      setCreating(false);
    }
  };

  const startRename = (sub) => {
    setEditingId(sub._id);
    setEditingName(sub.name);
    setRenameError('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
    setRenameError('');
  };

  const handleSaveRename = async (subId) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setRenameError('Subtopic name cannot be empty.');
      return;
    }
    setSavingRename(true);
    setRenameError('');
    try {
      await adminAPI.updateSubtopic(subId, { name: trimmed });
      addToast(`Subtopic renamed to "${trimmed}".`, 'success');
      setEditingId(null);
      setEditingName('');
      await fetchTaxonomy();
    } catch (err) {
      setRenameError(getApiErrorMessage(err, 'Unable to rename subtopic.'));
    } finally {
      setSavingRename(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await adminAPI.deleteSubtopic(deleteTarget._id);
      addToast(`Subtopic "${deleteTarget.name}" deleted.`, 'success');
      setDeleteTarget(null);
      await fetchTaxonomy();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Unable to delete subtopic.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Taxonomy Management
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
          Subtopic Taxonomy
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Manage subtopic tags under the 4 fixed core subjects (DBMS, DSA, OOP, OS). Subtopics in
          use by questions are protected from deletion.
        </p>
      </div>

      {/* Inline Add Subtopic Card */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Tags className="w-4 h-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Add Subtopic
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={newTopicId}
            onChange={(e) => {
              setNewTopicId(e.target.value);
              setCreateError('');
            }}
            aria-label="Topic for new subtopic"
            className="h-9 sm:w-40 rounded-md border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#09090B] px-2.5 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <input
            ref={nameInputRef}
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setCreateError('');
            }}
            placeholder="e.g. Trie & Prefix Trees, Query Optimization, Memory Barriers..."
            aria-label="New subtopic name"
            data-testid="new-subtopic-input"
            className="flex-1 h-9 rounded-md border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#09090B] px-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />

          <button
            type="submit"
            disabled={creating}
            data-testid="add-subtopic-submit"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 shrink-0"
          >
            {creating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>Add Subtopic</span>
          </button>
        </div>

        {createError && (
          <div
            role="alert"
            className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2 flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{createError}</span>
          </div>
        )}
      </form>

      {/* Topic Filter Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter subtopics by topic"
          className="inline-flex flex-wrap rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTopicFilter === ''}
            onClick={() => setActiveTopicFilter('')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTopicFilter === ''
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All Topics ({subtopics.length})
          </button>
          {topics.map((t) => {
            const count = subtopics.filter((s) => extractTopicId(s.topicID) === t._id).length;
            const active = activeTopicFilter === t._id;
            return (
              <button
                key={t._id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTopicFilter(t._id)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {t.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Grouped Topic Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-5 space-y-3"
            >
              <div className="h-4 w-24 rounded skeleton-shimmer" />
              <div className="h-8 w-full rounded skeleton-shimmer" />
              <div className="h-8 w-full rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedTopics.map(({ topic, items }) => (
            <section
              key={topic._id}
              className="rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] overflow-hidden flex flex-col"
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#141418] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {topic.name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    Fixed Core Topic
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  {items.length} {items.length === 1 ? 'subtopic' : 'subtopics'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No subtopics registered under {topic.name} yet.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-[#27272A]">
                  {items.map((sub) => {
                    const isEditing = editingId === sub._id;
                    return (
                      <li
                        key={sub._id}
                        className="px-4 py-2.5 flex flex-col gap-1.5 hover:bg-zinc-50/60 dark:hover:bg-[#18181B]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => {
                                  setEditingName(e.target.value);
                                  setRenameError('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveRename(sub._id);
                                  } else if (e.key === 'Escape') {
                                    cancelRename();
                                  }
                                }}
                                autoFocus
                                aria-label="Rename subtopic"
                                className="flex-1 h-8 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#09090B] px-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRename(sub._id)}
                                disabled={savingRename}
                                aria-label="Save subtopic name"
                                className="w-7 h-7 inline-flex items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:opacity-90 disabled:opacity-50"
                              >
                                {savingRename ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={cancelRename}
                                disabled={savingRename}
                                aria-label="Cancel rename"
                                className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-zinc-200 dark:border-[#27272A] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#27272A]"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {sub.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startRename(sub)}
                                  aria-label={`Rename ${sub.name}`}
                                  title="Rename subtopic"
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteError('');
                                    setDeleteTarget(sub);
                                  }}
                                  aria-label={`Delete ${sub.name}`}
                                  title="Delete subtopic"
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-md text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {isEditing && renameError && (
                          <p role="alert" className="text-[11px] text-amber-700 dark:text-amber-300">
                            {renameError}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <ConfirmActionModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete subtopic "${deleteTarget?.name || ''}"?`}
        description="Unused subtopics can be permanently removed. If any question in the bank references this subtopic, deletion will be blocked."
        detail={deleteTarget ? `Topic: ${deleteTarget.topicID?.name || ''}` : ''}
        confirmLabel="Delete Subtopic"
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

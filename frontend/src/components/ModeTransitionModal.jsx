import { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { ModeBadge } from './Badge';
import { getModeDisplayName } from '../utils/diagnostics';

export default function ModeTransitionModal({
  isOpen,
  transition,
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    confirmButtonRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen || !transition) return null;

  const fromLabel = getModeDisplayName(transition.fromMode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-transition-title"
      aria-describedby="mode-transition-desc"
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-[#111114] border border-zinc-200 dark:border-[#27272A] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <CheckCircle2
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h2
                id="mode-transition-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {fromLabel} Complete
              </h2>
              <p className="mt-0.5 text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                5/5 daily recovery questions solved
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close modal"
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Progression Strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#0D0D10] px-3.5 py-2.5">
          <ModeBadge mode={transition.fromMode} />
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
          <ModeBadge mode={transition.toMode} />
          {transition.nextDiagnosedSubtopic?.name && (
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
              · {transition.nextDiagnosedSubtopic.name}
            </span>
          )}
        </div>

        <p
          id="mode-transition-desc"
          className="mt-3.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
        >
          {transition.reason}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-transparent border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors whitespace-nowrap"
          >
            Stay &amp; Review
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <span>{loading ? 'Advancing...' : 'Continue to Next Mode'}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  error = '',
  fallbackAction = null,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const confirmClasses =
    variant === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-500 border-rose-600'
      : variant === 'warning'
      ? 'bg-amber-600 text-white hover:bg-amber-500 border-amber-600'
      : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-modal-title"
      data-lenis-prevent
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="confirm-action-modal-title"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close modal"
            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <p className="mt-2.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        )}

        {detail && (
          <div className="mt-3 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181B] px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
            {detail}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-2.5"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
            {fallbackAction && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={fallbackAction.onClick}
                  disabled={fallbackAction.loading || loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {fallbackAction.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{fallbackAction.label}</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium rounded-md border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${confirmClasses}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

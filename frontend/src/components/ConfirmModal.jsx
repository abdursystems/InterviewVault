import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
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

  if (!isOpen) return null;

  const confirmStyles =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-600 dark:border-rose-500'
      : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 border border-transparent';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-[#111114] border border-zinc-200 dark:border-[#27272A] p-6">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="confirm-modal-title"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </h2>
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

        <p
          id="confirm-modal-desc"
          className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
        >
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-transparent border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-50 ${confirmStyles}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

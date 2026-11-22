import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Repeat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USE_MOCK_DATA } from '../../services/api';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading, toggleMockRole } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Verifying administrator privileges...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Admin') {
    const handleQuickSwitch = async () => {
      setSwitching(true);
      try {
        await toggleMockRole();
      } finally {
        setSwitching(false);
      }
    };

    return (
      <div
        data-testid="admin-403-view"
        className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B] px-4 py-12"
      >
        <div className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                HTTP 403 · Forbidden
              </p>
              <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                Access denied: Admin privileges required
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Your current session is signed in as{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-200">{user?.name}</span>{' '}
            (<span className="font-mono text-xs">{user?.role || 'Student'}</span>). Only accounts
            with the <span className="font-mono text-xs">Admin</span> role can access the
            InterviewVault Administration Console.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Back to Student Dashboard</span>
            </Link>

            {USE_MOCK_DATA && (
              <button
                type="button"
                onClick={handleQuickSwitch}
                disabled={switching}
                data-testid="403-switch-mock-role"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <Repeat className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{switching ? 'Switching...' : 'Switch Mock Role to Admin'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

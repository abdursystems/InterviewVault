import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, X, Flame, Shield, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { attemptsAPI, ATTEMPT_RECORDED_EVENT, USE_MOCK_DATA } from '../services/api';
import { countQuestionsAttemptedToday } from '../utils/diagnostics';
import ConfirmModal from './ConfirmModal';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/recovery-plan', label: 'Recovery Plan' },
  { to: '/questions', label: 'Problems' },
  { to: '/history', label: 'History' },
];

export default function AppShell({ children, fullWidth = false }) {
  const { user, logout, toggleMockRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dailyStreakCount, setDailyStreakCount] = useState(0);
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    if (!user?._id) {
      setDailyStreakCount(0);
      return undefined;
    }

    let active = true;

    const refreshDailyStreak = async () => {
      try {
        const history = await attemptsAPI.getHistory();
        if (active) {
          setDailyStreakCount(countQuestionsAttemptedToday(history));
        }
      } catch {
        // Keep current count if history fetch fails
      }
    };

    refreshDailyStreak();
    window.addEventListener(ATTEMPT_RECORDED_EVENT, refreshDailyStreak);

    return () => {
      active = false;
      window.removeEventListener(ATTEMPT_RECORDED_EVENT, refreshDailyStreak);
    };
  }, [user?._id]);

  const handleConfirmLogout = () => {
    setLogoutOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchMockRole = async () => {
    if (!USE_MOCK_DATA) return;
    setSwitchingRole(true);
    try {
      await toggleMockRole();
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900 dark:bg-[#09090B] dark:text-zinc-100">
      <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 dark:border-[#27272A] bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-sm">
        <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-zinc-900 dark:text-zinc-100 shrink-0"
            >
              <rect
                x="2.5"
                y="2.5"
                width="19"
                height="19"
                rx="4"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M8 8.5V15.5M12 8.5L14.75 15.5L17.5 8.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              InterviewVault
            </span>
          </Link>

          {/* Zone 2: Primary Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 h-full"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative h-full inline-flex items-center text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-100 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900 dark:after:bg-zinc-100'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'Admin' && (
              <NavLink
                to="/admin"
                data-testid="nav-admin-console-link"
                className={({ isActive }) =>
                  `relative h-full inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-100 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900 dark:after:bg-zinc-100'
                      : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Admin Console</span>
              </NavLink>
            )}
          </nav>

          {/* Zone 3: Daily Streak Badge, User Profile, Theme Toggle, Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user && (
              <div
                data-testid="daily-streak-badge"
                title={`${dailyStreakCount} ${
                  dailyStreakCount === 1 ? 'question' : 'questions'
                } attempted today`}
                aria-label={`Daily streak: ${dailyStreakCount} ${
                  dailyStreakCount === 1 ? 'question' : 'questions'
                } attempted today`}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-mono font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                  dailyStreakCount > 0
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25'
                    : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-[#18181B] border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                <Flame
                  className={`w-3.5 h-3.5 shrink-0 ${
                    dailyStreakCount > 0
                      ? 'text-orange-500 dark:text-amber-400 fill-orange-500/25 dark:fill-amber-400/25'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                  aria-hidden="true"
                />
                <span>{dailyStreakCount}</span>
              </div>
            )}

            {USE_MOCK_DATA && user && (
              <button
                type="button"
                onClick={handleSwitchMockRole}
                disabled={switchingRole}
                data-testid="mock-role-switcher"
                title="Dev-only: Switch Mock Role (Student / Admin)"
                className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono font-medium border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181B] text-zinc-600 dark:text-zinc-300 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Repeat className="w-3 h-3" aria-hidden="true" />
                <span>{switchingRole ? 'Switching...' : 'Switch Role'}</span>
              </button>
            )}

            {user && (
              <div className="hidden lg:flex items-center gap-2 pr-2 border-r border-zinc-200 dark:border-[#27272A]">
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                  {user.name}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A]">
                  {user.role}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181B] hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log out</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] px-4 py-3 space-y-1">
            {user && (
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-200 dark:border-[#27272A]">
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {user.name}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  {user.role}
                </span>
              </div>
            )}
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#18181B]/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'Admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              >
                <Shield className="w-4 h-4" aria-hidden="true" />
                <span>Admin Console</span>
              </NavLink>
            )}
            {USE_MOCK_DATA && user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSwitchMockRole();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
              >
                <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Switch Mock Role (Student / Admin)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setLogoutOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </header>

      <main
        className={`flex-1 w-full mx-auto ${
          fullWidth ? 'max-w-[1440px] px-4 sm:px-6 py-4' : 'max-w-[1200px] px-4 sm:px-6 py-8'
        }`}
      >
        {children}
      </main>

      <ConfirmModal
        isOpen={logoutOpen}
        title="Sign out of InterviewVault?"
        description="Your current session token will be cleared from this browser. Unsubmitted question drafts stored locally will remain available."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}

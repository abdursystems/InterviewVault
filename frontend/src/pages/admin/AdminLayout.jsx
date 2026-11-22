import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCode2,
  Tags,
  Users,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { USE_MOCK_DATA } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const AdminToastContext = createContext(null);

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    return { addToast: () => {} };
  }
  return ctx;
}

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/questions', label: 'Question Bank', icon: FileCode2, end: false },
  { to: '/admin/subtopics', label: 'Subtopic Taxonomy', icon: Tags, end: false },
  { to: '/admin/users', label: 'User Management', icon: Users, end: false },
];

const ROUTE_TITLES = {
  '/admin': 'Overview',
  '/admin/questions': 'Question Bank',
  '/admin/subtopics': 'Subtopic Taxonomy',
  '/admin/users': 'User Management',
};

export default function AdminLayout() {
  const { user, logout, toggleMockRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!mobileDrawerOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileDrawerOpen]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, variant = 'success') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const toastCtxValue = useMemo(() => ({ addToast }), [addToast]);

  const currentSection = ROUTE_TITLES[location.pathname] || 'Console';

  const handleConfirmLogout = () => {
    setLogoutOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchMockRole = async () => {
    if (!USE_MOCK_DATA) return;
    setSwitchingRole(true);
    try {
      const updated = await toggleMockRole();
      if (updated && updated.role !== 'Admin') {
        navigate('/dashboard');
      }
    } finally {
      setSwitchingRole(false);
    }
  };

  const renderSidebarLinks = (isMobile = false) => (
    <nav
      aria-label="Admin navigation"
      className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto"
      data-lenis-prevent
    >
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => {
              if (isMobile) setMobileDrawerOpen(false);
            }}
            title={!isMobile && collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181B] hover:text-zinc-900 dark:hover:text-zinc-100'
              } ${!isMobile && collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <AdminToastContext.Provider value={toastCtxValue}>
      <div className="min-h-screen flex bg-[#FAFAFA] text-zinc-900 dark:bg-[#09090B] dark:text-zinc-100">
        {/* Desktop Collapsible Left Sidebar (256px expanded) */}
        <aside
          className={`hidden md:flex flex-col shrink-0 border-r border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#0D0D10] transition-[width] duration-150 ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar Brand Header */}
          <div
            className={`h-14 border-b border-zinc-200 dark:border-[#27272A] flex items-center shrink-0 ${
              collapsed ? 'justify-center px-2' : 'justify-between px-4'
            }`}
          >
            <Link
              to="/admin"
              className="flex items-center gap-2.5 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded"
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
              {!collapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                    InterviewVault
                  </span>
                  <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-300 shrink-0">
                    Admin
                  </span>
                </div>
              )}
            </Link>
          </div>

          {renderSidebarLinks(false)}

          {/* Sidebar Footer */}
          <div className="p-2.5 border-t border-zinc-200 dark:border-[#27272A] space-y-2 shrink-0">
            <Link
              to="/dashboard"
              title={collapsed ? 'Back to Student App' : undefined}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">Back to Student App</span>}
            </Link>

            {!collapsed && user && (
              <div className="px-2.5 py-2 rounded-lg bg-zinc-50 dark:bg-[#141418] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-xs font-mono font-semibold shrink-0">
                  {(user.name || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden flex"
            data-lenis-prevent
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" aria-hidden="true" />
            <div
              className="relative z-50 w-64 max-w-[80vw] h-full bg-white dark:bg-[#0D0D10] border-r border-zinc-200 dark:border-[#27272A] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 px-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  <span className="text-sm font-semibold">Admin Console</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close sidebar"
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderSidebarLinks(true)}
              <div className="p-3 border-t border-zinc-200 dark:border-[#27272A] space-y-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Student App</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 dark:border-[#27272A] bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open admin navigation"
                className="md:hidden w-8 h-8 inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
              >
                <Menu className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="hidden md:inline-flex w-8 h-8 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>

              <div className="flex items-center gap-2 text-xs min-w-0">
                <Link
                  to="/admin"
                  className="font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Admin
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">/</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {currentSection}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {USE_MOCK_DATA && (
                <button
                  type="button"
                  onClick={handleSwitchMockRole}
                  disabled={switchingRole}
                  data-testid="mock-role-switcher"
                  title="Dev-only: Switch between Student and Admin mock roles"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-medium border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181B] text-zinc-700 dark:text-zinc-300 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <Repeat className="w-3 h-3" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {switchingRole ? 'Switching...' : 'Switch Mock Role (Student / Admin)'}
                  </span>
                  <span className="sm:hidden">Switch Role</span>
                </button>
              )}

              <Link
                to="/dashboard"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181B] hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Student App</span>
              </Link>

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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181B] hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </header>

          {/* Main Content Outlet */}
          <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-7">
            <Outlet />
          </main>
        </div>

        {/* Global Toast Stack */}
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
        >
          {toasts.map((toast) => {
            const styles = {
              success:
                'border-emerald-500/30 bg-white dark:bg-[#111114] text-emerald-700 dark:text-emerald-300',
              warning:
                'border-amber-500/35 bg-white dark:bg-[#111114] text-amber-800 dark:text-amber-300',
              error:
                'border-rose-500/35 bg-white dark:bg-[#111114] text-rose-700 dark:text-rose-300',
              info: 'border-sky-500/30 bg-white dark:bg-[#111114] text-sky-700 dark:text-sky-300',
            };
            const Icon =
              toast.variant === 'warning'
                ? AlertTriangle
                : toast.variant === 'error'
                ? XCircle
                : toast.variant === 'info'
                ? Info
                : CheckCircle2;

            return (
              <div
                key={toast.id}
                role="status"
                data-testid="admin-toast"
                className={`pointer-events-auto rounded-lg border shadow-lg px-3.5 py-2.5 flex items-start gap-2.5 text-xs ${
                  styles[toast.variant] || styles.success
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="flex-1 leading-relaxed font-medium text-zinc-900 dark:text-zinc-100">
                  {toast.message}
                </span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <ConfirmModal
          isOpen={logoutOpen}
          title="Sign out of InterviewVault?"
          description="Your current administrator session token will be cleared from this browser."
          confirmLabel="Log out"
          cancelLabel="Stay signed in"
          variant="danger"
          onConfirm={handleConfirmLogout}
          onCancel={() => setLogoutOpen(false)}
        />
      </div>
    </AdminToastContext.Provider>
  );
}

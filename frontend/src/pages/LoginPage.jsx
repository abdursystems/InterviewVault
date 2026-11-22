import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { USE_MOCK_DATA, getApiErrorMessage } from '../services/api';
import { validateAuthForm } from '../utils/diagnostics';

export default function LoginPage() {
  const { login, register, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // Support ?autostart=1 in mock mode for rapid verification workflows
  useEffect(() => {
    if (USE_MOCK_DATA && !loading && searchParams.get('autostart') === '1' && !isAuthenticated) {
      login({ email: 'maya.chen@cs.edu', password: 'Password123!' })
        .then(() => navigate('/dashboard', { replace: true }))
        .catch(() => {});
    }
  }, [searchParams, loading, isAuthenticated, login, navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFieldErrors({});
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validateAuthForm(mode, { name, email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to authenticate. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword('Password123!');
    setFieldErrors({});
    setServerError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-5xl mx-auto flex flex-col flex-1 justify-between">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-zinc-900 dark:text-zinc-100"
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
            <span className="text-[15px] font-semibold tracking-tight">InterviewVault</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 [text-wrap:balance]">
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your student account'}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {mode === 'login'
              ? 'Continue your daily diagnostic recovery plan across DSA, OOP, DBMS, and OS.'
              : 'Start tracking attempt accuracy and unlock deterministic root-cause drills.'}
          </p>

          {/* Segmented Mode Control */}
          <div
            className="mt-6 grid grid-cols-2 p-1 rounded-md bg-zinc-100 dark:bg-[#111114] border border-zinc-200 dark:border-[#27272A]"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-[#27272A]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-[#27272A]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Create account
            </button>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 p-3 rounded-md bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                  }}
                  placeholder="Maya Chen"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-[#111114] border border-zinc-300 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.name}</p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                University or personal email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                }}
                placeholder="student@cs.edu"
                aria-invalid={Boolean(fieldErrors.email)}
                className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-[#111114] border border-zinc-300 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
                }}
                placeholder="Minimum 8 characters"
                aria-invalid={Boolean(fieldErrors.password)}
                className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-[#111114] border border-zinc-300 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
              />
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>
                {submitting
                  ? mode === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          {USE_MOCK_DATA && (
            <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-[#27272A]">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2.5">
                Preview accounts (fills form credentials)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('maya.chen@cs.edu')}
                  className="text-left px-3 py-2 rounded-md border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181B] transition-colors"
                >
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Maya Chen
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    Root-Cause · Recursion
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('alex.new@cs.edu')}
                  className="text-left px-3 py-2 rounded-md border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181B] transition-colors"
                >
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Alex Rivera
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    Onboarding · New
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

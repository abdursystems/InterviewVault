import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  Code2,
  GitBranch,
  Check,
  Target,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const HERO_IMAGE_SRC = '/assets/aistudio/hero_img1_7c515ca5.jpg';

const PREP_STATISTICS = [
  {
    value: '3.4×',
    label: 'Higher technical pass rate',
    detail:
      'Candidates practicing targeted weak subtopics clear onsite rounds over three times more often than those grinding random lists.',
  },
  {
    value: '78%',
    label: 'Decisions hinge on fundamentals',
    detail:
      'Hiring committees point to clear reasoning in DSA, OOP, DBMS, and OS over memorized syntax as the decisive hire signal.',
  },
  {
    value: '64%',
    label: 'Fewer repeat errors',
    detail:
      'Structured retries and spaced review within 48 hours dramatically cut recurring mistakes on recursion, concurrency, and SQL.',
  },
  {
    value: '13',
    label: 'Core CS subtopics tracked',
    detail:
      'Granular accuracy, attempt velocity, and recency measured across DSA, OOP, DBMS, and OS without manual spreadsheets.',
  },
];

const FREE_FOREVER_ITEMS = [
  'Full Python coding & CS theory problem library',
  'Deterministic Root-Cause Diagnosis engine',
  'Daily 5-question personalized recovery queue',
  'Unlimited attempt history & subtopic telemetry',
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const primaryCtaPath = isAuthenticated ? '/dashboard' : '/login';
  const primaryCtaLabel = isAuthenticated ? 'Open Dashboard' : 'Start Practicing Free';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900 dark:bg-[#09090B] dark:text-zinc-100">
      {/* Persistent Public Top Navigation Bar (3-Zone Contract) */}
      <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 dark:border-[#27272A] bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-sm">
        <div className="h-full max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#hero"
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
          </a>

          {/* Zone 2: Concise Single-Line Section Links */}
          <nav aria-label="Home page sections" className="hidden md:flex items-center gap-7">
            <a
              href="#hero"
              className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
            <a
              href="#benefits"
              className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              Benefits
            </a>
          </nav>

          {/* Zone 3: Theme Toggle + Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to={primaryCtaPath}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>{isAuthenticated ? 'Open Dashboard' : 'Sign in'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-b border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] px-4 py-3 space-y-1">
            {[
              { href: '#hero', label: 'Home' },
              { href: '#about', label: 'About' },
              { href: '#benefits', label: 'Benefits' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181B]"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-zinc-200 dark:border-[#27272A]">
              <Link
                to={primaryCtaPath}
                onClick={() => setMobileNavOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ================================================================ */}
        {/* SECTION 1: HERO                                                  */}
        {/* ================================================================ */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="scroll-mt-14 relative overflow-hidden border-b border-zinc-200 dark:border-[#27272A] bg-gradient-to-br from-emerald-50/70 via-[#FAFAFA] to-amber-50/70 dark:from-[#0C1414] dark:via-[#09090B] dark:to-[#14110B]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left-aligned Creative Phrase & Welcome Copy */}
              <div className="lg:col-span-6 text-left space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  <span>Welcome to InterviewVault</span>
                  <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
                    ·
                  </span>
                  <span className="text-amber-700 dark:text-amber-400">
                    Open-Source &amp; 100% Free
                  </span>
                </div>

                <h1
                  id="hero-heading"
                  className="text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 [text-wrap:balance]"
                >
                  Walk into the interview room knowing your weak spots are already fixed.
                </h1>

                <p className="text-base sm:text-[17px] leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl">
                  Stop guessing what to study next. InterviewVault spots your exact weak points
                  across algorithms, object oriented design, databases, and operating systems. It
                  turns those blind spots into a clear daily practice plan, making sure every study
                  hour builds real confidence for your next interview.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    to={primaryCtaPath}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{primaryCtaLabel}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  <a
                    href="#about"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-[#27272A] bg-white/80 dark:bg-[#111114]/80 hover:bg-white dark:hover:bg-[#18181B] transition-colors whitespace-nowrap shrink-0"
                  >
                    Explore how it works
                  </a>
                </div>
              </div>

              {/* Right-aligned Attached Vector Illustration */}
              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                <div className="w-full max-w-[580px] rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white p-4 sm:p-6">
                  {imgFailed ? (
                    <div className="aspect-[16/11] w-full rounded-lg bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col items-center justify-center gap-3 text-center p-6 border border-zinc-200">
                      <Code2 className="w-10 h-10 text-emerald-600" aria-hidden="true" />
                      <p className="text-sm font-medium text-zinc-800">
                        Technical Interview Preparation Workspace
                      </p>
                    </div>
                  ) : (
                    <img
                      src={HERO_IMAGE_SRC}
                      alt="Illustration of a computer science candidate and interviewer discussing technical solutions across a desk"
                      referrerPolicy="no-referrer"
                      onError={() => setImgFailed(true)}
                      className="w-full h-auto rounded-lg object-contain block"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 2: ABOUT & PREPARATION STATISTICS                        */}
        {/* ================================================================ */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="scroll-mt-14 border-b border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#0B0B0E]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-20 sm:py-24 space-y-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-3">
                <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                  01. About InterviewVault
                </p>
                <h2
                  id="about-heading"
                  className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 [text-wrap:balance]"
                >
                  Job offers aren&apos;t won by luck at the whiteboard. They&apos;re earned through
                  smart, focused preparation long before you ever sit down.
                </h2>
              </div>

              <div className="lg:col-span-7 space-y-4 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                <p>
                  Most computer science students spend months grinding through hundreds of random
                  practice problems. Yet they rarely realize that just two or three small blind
                  spots, like recursion, database locks, or system deadlocks, are the real reason
                  they keep missing out on final offers.
                </p>
                <p>
                  We built <strong className="font-semibold text-zinc-900 dark:text-zinc-100">InterviewVault</strong>{' '}
                  to take the guesswork out of interview prep. Every time you run Python code or
                  review a concept, our system learns where you struggle and why. Instead of random
                  practice, you get a simple daily routine: two targeted drills, one retry of a past
                  mistake, one quick refresher, and one stretch challenge. Best of all, every single
                  task comes with a plain English note explaining why it&apos;s on your list.
                </p>
              </div>
            </div>

            {/* Preparation & Interview Outcome Statistics */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Why structured preparation outperforms random grinding
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Benchmarks across structured CS interview preparation cohorts
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#111114] divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-[#27272A] overflow-hidden">
                {PREP_STATISTICS.map((stat) => (
                  <div key={stat.label} className="p-6 space-y-2.5">
                    <div className="text-3xl font-mono font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50">
                      {stat.value}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {stat.label}
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 3: BENEFITS, OPEN-SOURCE SAAS & $0 FREE HIGHLIGHT        */}
        {/* ================================================================ */}
        <section
          id="benefits"
          aria-labelledby="benefits-heading"
          className="scroll-mt-14 bg-[#FAFAFA] dark:bg-[#09090B]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-20 sm:py-24 space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                02. Benefits &amp; Open-Source Promise
              </p>
              <h2
                id="benefits-heading"
                className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 [text-wrap:balance]"
              >
                Built to sharpen your preparation, stay effortless to use, and never charge you a
                penny.
              </h2>
            </div>

            {/* Asymmetric Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Marquee Highlight: Zero Cost Forever */}
              <div className="lg:col-span-7 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.07] p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400">
                      Zero Paywalls · Zero Subscriptions
                    </span>
                    <span className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      $0 / forever
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 [text-wrap:balance]">
                    InterviewVault doesn&apos;t charge students a single penny.
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    Quality technical interview preparation shouldn&apos;t sit behind monthly
                    paywalls or locked problem sets. Every coding test suite, theory rubric,
                    diagnostic metric, and daily recovery plan is completely free from day one—no
                    credit card, no trial countdown, no hidden tiers.
                  </p>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-emerald-500/20 text-xs text-zinc-800 dark:text-zinc-200">
                  {FREE_FOREVER_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check
                        className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Open-Source SaaS Card */}
              <div className="lg:col-span-5 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <GitBranch
                    className="w-5 h-5 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Open-Source SaaS, Open to Improvements
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    InterviewVault is built in the open as a community-driven SaaS product.
                    Students, educators, and engineers can inspect how diagnostics work, propose
                    better CS questions and edge-case test suites, refine UI ergonomics, and shape
                    the roadmap together.
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-[#27272A] flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <span>Transparent deterministic engine</span>
                  <span className="text-zinc-800 dark:text-zinc-200">PRs welcome</span>
                </div>
              </div>

              {/* Positive Impact on Preparation */}
              <div className="lg:col-span-6 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 sm:p-7 space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <Target className="w-4 h-4 text-rose-500" aria-hidden="true" />
                  <span>Progress You Can Actually See</span>
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Turn interview anxiety into a simple daily checklist
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Watch your progress rings grow across every core subject as our smart tracker
                  shows you exactly how to spend your next 30 minutes. Compare your work side by
                  side with clear model answers so you can explain your thinking out loud just as
                  smoothly as you write Python code.
                </p>
              </div>

              {/* Ease of Use */}
              <div className="lg:col-span-6 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 sm:p-7 space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <SlidersHorizontal className="w-4 h-4 text-sky-500" aria-hidden="true" />
                  <span>Designed for Deep Focus</span>
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Zero clutter, fast keyboard-friendly workspace
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Jump straight into a clean split screen editor with color coded Python, instant
                  topic filters, automatic draft saving, and a built in session timer. Switch
                  between dark and light themes made to keep your eyes comfortable during late night
                  study sessions.
                </p>
              </div>
            </div>

            {/* Closing Action Strip */}
            <div className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  Ready when you are · No credit card required
                </p>
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Start diagnosing your interview readiness in under a minute.
                </h3>
              </div>

              <Link
                to={primaryCtaPath}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#09090B]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">InterviewVault</span>
            <span aria-hidden="true">·</span>
            <span>Open-Source CS Interview Diagnostics · Free Forever</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#hero" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              About
            </a>
            <a
              href="#benefits"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Benefits
            </a>
            <Link
              to={primaryCtaPath}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {isAuthenticated ? 'Dashboard' : 'Sign in'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

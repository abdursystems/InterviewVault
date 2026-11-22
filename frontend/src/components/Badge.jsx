import { Check, CircleDashed, Minus, Clock, Target, RotateCcw, BookOpen, ArrowUpRight } from 'lucide-react';

export function DifficultyBadge({ difficulty }) {
  const styles = {
    Easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    Hard: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border whitespace-nowrap shrink-0 ${
        styles[difficulty] || 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
      }`}
    >
      {difficulty}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = {
    Solved: {
      cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      Icon: Check,
    },
    Completed: {
      cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      Icon: Check,
    },
    Attempted: {
      cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
      Icon: CircleDashed,
    },
    Pending: {
      cls: 'text-zinc-600 dark:text-zinc-300 bg-zinc-500/10 border-zinc-400/25 dark:border-zinc-700',
      Icon: Clock,
    },
    Skipped: {
      cls: 'text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 border-zinc-400/20 dark:border-zinc-700/80',
      Icon: Minus,
    },
    Unattempted: {
      cls: 'text-zinc-500 dark:text-zinc-500 bg-transparent border-zinc-300 dark:border-zinc-800',
      Icon: null,
    },
  };

  const entry = config[status] || config.Unattempted;
  const Icon = entry.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border whitespace-nowrap shrink-0 ${entry.cls}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{status}</span>
    </span>
  );
}

export function RoleBadge({ role }) {
  const config = {
    Focus: {
      cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25',
      Icon: Target,
    },
    Retry: {
      cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
      Icon: RotateCcw,
    },
    Review: {
      cls: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/25',
      Icon: BookOpen,
    },
    Stretch: {
      cls: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
      Icon: ArrowUpRight,
    },
  };

  const entry = config[role] || config.Focus;
  const Icon = entry.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border whitespace-nowrap shrink-0 ${entry.cls}`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{role}</span>
    </span>
  );
}

export function ModeBadge({ mode }) {
  const labels = {
    RootCause: {
      label: 'Weak-Spot Fix',
      cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25',
    },
    GeneralPractice: {
      label: 'All-Round Practice',
      cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    },
    Onboarding: {
      label: 'Initial Assessment',
      cls: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/25',
    },
  };

  const entry = labels[mode] || {
    label: mode || 'Diagnostic',
    cls: 'text-zinc-600 dark:text-zinc-300 bg-zinc-500/10 border-zinc-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-medium border whitespace-nowrap shrink-0 ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}

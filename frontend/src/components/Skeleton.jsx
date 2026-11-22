export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-shimmer rounded ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard">
      <div className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="mt-3 h-8 w-80 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-2/3" />
        <SkeletonBlock className="mt-5 h-2 w-full max-w-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-5 w-16" />
              <SkeletonBlock className="h-10 w-10 rounded-full" />
            </div>
            <SkeletonBlock className="h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-6 space-y-3">
        <SkeletonBlock className="h-5 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y divide-zinc-200 dark:divide-[#27272A]" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <div className="space-y-2 flex-1">
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-3 w-40" />
          </div>
          <SkeletonBlock className="h-5 w-16" />
          <SkeletonBlock className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function PlanSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading recovery plan">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#111114] p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-5 w-16" />
              <SkeletonBlock className="h-5 w-14" />
            </div>
            <SkeletonBlock className="h-8 w-24" />
          </div>
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

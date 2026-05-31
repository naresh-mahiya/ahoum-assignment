/** Animated shimmer placeholder shown while session cards load. */
export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="relative h-44 overflow-hidden bg-slate-200">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="flex justify-between pt-2">
          <div className="h-4 w-16 rounded bg-slate-200" />
          <div className="h-4 w-12 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

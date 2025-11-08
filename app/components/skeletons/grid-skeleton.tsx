// app/components/skeletons/grid-skeleton.tsx
"use client";

export default function GridSkeleton({ items = 6 }: { items?: number }) {
    return (
        <div className="py-8 space-y-4">
            {/* Title bar shimmer */}
            <div className="h-10 w-40 bg-slate-200 rounded animate-pulse mx-auto" />
            <div className="h-6 w-80 bg-slate-200 rounded animate-pulse mx-auto mb-8" />


            {/* Cards shimmer */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: items }).map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-200">
                        <div className="mx-auto rounded-full bg-slate-200 w-24 h-24 animate-pulse" />
                        <div className="mt-3 h-4 bg-slate-200 rounded w-24 mx-auto animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
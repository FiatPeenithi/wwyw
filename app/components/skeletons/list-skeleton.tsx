"use client";

export default function ListSkeleton({ items = 6 }: { items?: number }) {
    return (
        <div className="py-8 space-y-4">
            {/* Title bar shimmer */}
            <div className="h-10 w-40 bg-slate-200 rounded animate-pulse mx-auto" />
            <div className="h-6 w-80 bg-slate-200 rounded animate-pulse mx-auto mb-8" />

            {/* Cards shimmer */}
            <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: items }).map((_, i) => (
                    <div key={i} className="p-6 rounded border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="rounded bg-slate-200 w-24 h-24 flex-shrink-0 animate-pulse" />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" />
                                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
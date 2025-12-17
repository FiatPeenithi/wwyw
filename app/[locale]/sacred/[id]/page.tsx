"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/app/components/main-layout";
import GridSkeleton from "@/app/components/skeletons/grid-skeleton";
import { driveImageUrl } from "@/app/lib/drive-image";
import Image from "next/image";
import ExpandableText from "@/app/components/expandable-text";

type SacredView = {
    id: string;
    name: string;
    category?: string;
    prayers?: string;
    worship?: string;
    isHighlight?: string | boolean;
    thumbnail?: string;
};

type RelatedTemple = {
    id: string;
    name: string;
} | null;

export default function SacredDetailPage() {
    const { id } = useParams<{ id: string }>();
    const locale = useLocale();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sacred, setSacred] = useState<SacredView | null>(null);
    const [temple, setTemple] = useState<RelatedTemple>(null);

    const t = {
        back: locale === "en" ? "Back" : "ย้อนกลับ",
        temple: locale === "en" ? "Temple" : "วัด",
        prayers: locale === "en" ? "Prayers" : "บทสวด",
        worship: locale === "en" ? "Worship" : "วิธีบูชา",
        highlight: locale === "en" ? "Highlight" : "ไฮไลท์",
    } as const;

    useEffect(() => {
        let active = true;
        async function run() {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/sacred/${id}?locale=${locale}`, {
                    next: { revalidate: 60 },
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Failed to load sacred item");
                if (!active) return;

                setSacred(json.sacred);
                setTemple(json.relatedTemple);
            } catch (e: any) {
                if (active) setError(e?.message || "Unknown error");
            } finally {
                if (active) setLoading(false);
            }
        }
        run();
        return () => {
            active = false;
        };
    }, [id, locale]);

    if (error) {
        return (
            <MainLayout loading={false}>
                <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-200">
                    Error: {error}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout loading={loading} loadingSlot={<GridSkeleton />}>
            <div className="min-h-screen pb-24 bg-slate-50">
                {/* Sticky Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                    <div className="flex items-center p-4 gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        >
                            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-semibold text-slate-900 truncate flex-1">
                            {sacred?.name}
                        </h1>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative w-full aspect-video bg-slate-200">
                    {sacred?.thumbnail ? (
                        <Image
                            src={driveImageUrl(sacred.thumbnail)}
                            alt={sacred.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-slate-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </section>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Header Info */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">{sacred?.name}</h2>
                            {(String(sacred?.isHighlight) === "yes" || sacred?.isHighlight === true) && (
                                <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-full">
                                    {t.highlight}
                                </span>
                            )}
                        </div>
                        {sacred?.category && (
                            <p className="text-sm text-slate-500 font-medium">
                                {sacred.category}
                            </p>
                        )}
                    </div>

                    {/* Prayers */}
                    {sacred?.prayers && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                                <h3 className="text-base font-semibold text-slate-900">
                                    {t.prayers}
                                </h3>
                            </div>
                            <ExpandableText className="text-sm text-slate-700 font-serif bg-slate-50 p-3 rounded-xl">
                                {sacred.prayers}
                            </ExpandableText>
                        </div>
                    )}

                    {/* Worship */}
                    {sacred?.worship && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                                <h3 className="text-base font-semibold text-slate-900">
                                    {t.worship}
                                </h3>
                            </div>
                            <ExpandableText className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                {sacred.worship}
                            </ExpandableText>
                        </div>
                    )}

                    {/* Related Temple Link */}
                    {temple && (
                        <div
                            onClick={() => router.push(`/temple/${temple.id}`)}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">{t.temple}</div>
                                    <div className="text-sm font-semibold text-slate-900">{temple.name}</div>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

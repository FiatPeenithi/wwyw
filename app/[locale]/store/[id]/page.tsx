"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/app/components/main-layout";
import GridSkeleton from "@/app/components/skeletons/grid-skeleton";
import { driveImageUrl } from "@/app/lib/drive-image";
import Image from "next/image";

type StoreView = {
    id: string;
    name: string;
    short?: string;
    tel?: string;
    open_at?: string;
    close_at?: string;
    off_days?: string;
    thumbnail?: string;
};

type RelatedCommunity = {
    id: string;
    name: string;
} | null;

export default function StoreDetailPage() {
    const { id } = useParams<{ id: string }>();
    const locale = useLocale();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [store, setStore] = useState<StoreView | null>(null);
    const [community, setCommunity] = useState<RelatedCommunity>(null);

    const t = {
        open: locale === "en" ? "Open" : "เปิด",
        close: locale === "en" ? "Close" : "ปิด",
        call: locale === "en" ? "Call" : "โทร",
        back: locale === "en" ? "Back" : "ย้อนกลับ",
        community: locale === "en" ? "Community" : "ชุมชน",
    } as const;

    useEffect(() => {
        let active = true;
        async function run() {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/stores/${id}?locale=${locale}`, {
                    next: { revalidate: 60 },
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Failed to load store");
                if (!active) return;

                setStore(json.store);
                setCommunity(json.relatedCommunity);
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
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
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
                            {store?.name}
                        </h1>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative w-full aspect-video bg-slate-200">
                    {store?.thumbnail ? (
                        <Image
                            src={driveImageUrl(store.thumbnail)}
                            alt={store.name}
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
                        <h2 className="text-xl font-bold text-slate-900 mb-2">{store?.name}</h2>
                        {store?.short && (
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {store.short}
                            </p>
                        )}
                    </div>

                    {/* Opening Hours */}
                    {(store?.open_at || store?.close_at) && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                                <h3 className="text-base font-semibold text-slate-900">
                                    {locale === 'en' ? 'Opening Hours' : 'เวลาทำการ'}
                                </h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                {store.open_at && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">{t.open}:</span>
                                        <span className="font-medium text-slate-900">{store.open_at}</span>
                                    </div>
                                )}
                                {store.close_at && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">{t.close}:</span>
                                        <span className="font-medium text-slate-900">{store.close_at}</span>
                                    </div>
                                )}
                            </div>
                            {store.off_days && (
                                <div className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg inline-block">
                                    {locale === 'en' ? `Closed days: ${store.off_days}` : `หยุด ${store.off_days}`}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Related Community Link */}
                    {community && (
                        <div
                            onClick={() => router.push(`/community/${community.id}`)}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">{t.community}</div>
                                    <div className="text-sm font-semibold text-slate-900">{community.name}</div>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Action Bar */}
            {store?.tel && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
                    <div className="px-4 py-3">
                        <a
                            href={`tel:${store.tel}`}
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {t.call} {store.tel}
                        </a>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

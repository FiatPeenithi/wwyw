// app/[locale]/trips/page.tsx  (Client Component)
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import MainLayout from "@/app/components/main-layout";
import ListSkeleton from "@/app/components/skeletons/list-skeleton";
import LocationCard from "@/app/components/location-card";
import { Star } from "lucide-react";

type TripItem = {
  id: string;
  name: string;
  short: string;
  matchCount: number;
  categoryIds: string[];
  categoryNames: string[];
};

type RatingInfo = { avg: number; count: number };

export default function TripsPage() {
  const t = useTranslations("Trips");
  const locale = useLocale();
  const isTH = locale?.startsWith("th");

  const [loading, setLoading] = useState<boolean>(true);
  const [trips, setTrips] = useState<TripItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0); // minimal, no refactor
  const fetchControllerRef = useRef<AbortController | null>(null);

  // ratings state per trip
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const ratingsControllerRef = useRef<AbortController | null>(null);

  // announce area for a11y feedback (Law: Provide feedback)
  const [announce, setAnnounce] = useState<string>("");

  // Small helper to (re)load with AbortController (Law: Prevent errors)
  async function load() {
    try {
      // cancel any in-flight
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      setLoading(true);
      setError(null);
      setRatings({});

      const raw = localStorage.getItem("selectedCategories");
      const arr: Array<{ id: string }> = raw ? JSON.parse(raw) : [];
      const ids = arr.map((x) => x.id).filter(Boolean);

      if (ids.length === 0) {
        setTrips([]);
        setAnnounce(t("empty")); // a11y live announcement
        return;
      }

      const qs = new URLSearchParams({
        categoryIds: ids.join(","),
        locale,
      });

      const res = await fetch(`/api/trips?${qs.toString()}`, {
        signal: controller.signal,
        // hint browser cache; perceived performance (Law: Keep users in control)
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) throw new Error("Failed to fetch trips");

      const data: TripItem[] = await res.json();
      setTrips(data);
      setAnnounce(t("matchedCount", { count: data.length })); // announce count

      // After trips loaded, fetch rating summaries concurrently
      fetchRatings(data.map((d) => d.id));
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(String(e?.message || e));
      setAnnounce(t("error"));
    } finally {
      setLoading(false);
    }
  }

  // Fetch ratings for a list of trip IDs; simple client aggregation over /api/reviews
  async function fetchRatings(tripIds: string[]) {
    // cancel in-flight
    ratingsControllerRef.current?.abort();
    const controller = new AbortController();
    ratingsControllerRef.current = controller;

    // unique ids to avoid duplicate requests
    const unique = Array.from(new Set(tripIds.filter(Boolean)));
    try {
      const results = await Promise.all(
        unique.map(async (id) => {
          const res = await fetch(`/api/reviews?tripId=${encodeURIComponent(id)}`, {
            signal: controller.signal,
            headers: { "Cache-Control": "no-cache" },
          });
          if (!res.ok) return [id, { avg: 0, count: 0 }] as const;
          const data = await res.json();
          const items: Array<{ rating: number | null }> = Array.isArray(data?.items)
            ? data.items
            : [];
          const count = items.length;
          const avg = count
            ? Number(
                (
                  items.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count
                ).toFixed(2)
              )
            : 0;
          return [id, { avg, count }] as const;
        })
      );

      const map: Record<string, RatingInfo> = {};
      for (const [id, info] of results) map[id] = info;
      setRatings(map);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      // fail silently; keep UI without ratings
    }
  }

  useEffect(() => {
    load();
    return () => {
      fetchControllerRef.current?.abort();
      ratingsControllerRef.current?.abort();
    };
    // retryKey lets user tap "Retry" without heavy refactor
  }, [locale, retryKey]);

  // minimal key handler (Law: Accessible and predictable)
  const onCardKey = (e: React.KeyboardEvent<HTMLAnchorElement>, href: string) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      // <Link> handles navigation; no router push needed
      (e.currentTarget as HTMLAnchorElement).click();
    }
  };

  return (
    <MainLayout loading={loading} loadingSlot={<ListSkeleton />}>
      {/* a11y live region */}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* Error with next actions (Law: Give control/next step) */}
      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
          <div className="flex items-start justify-between gap-3">
            <span>{t("error")}</span>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {t("retry") ?? "Retry"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state with clear next action */}
      {!loading && trips !== null && trips.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p>{t("empty")}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t("emptyHint") ?? "ลองเลือกหมวดหมู่ใหม่เพื่อดูทริปที่เหมาะกับคุณ"}
              </p>
            </div>
            <Link
              href={`/${locale}/categories`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {t("changeFilters") ?? "เปลี่ยนหมวดหมู่"}
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && trips && trips.length > 0 && (
        <>
          <LocationCard />

          {/* Header */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("matchedCount", { count: trips.length })}
            </p>
          </div>

          {/* List */}
          <ul className="space-y-3">
            {trips.map((trip) => {
              const href = `/${locale}/trip/${trip.id}`;
              const rating = ratings[trip.id];
              return (
                <li key={trip.id}>
                  {/* Use Link for native a11y; whole card is the hit target */}
                  <Link
                    href={href}
                    onKeyDown={(e) => onCardKey(e, href)}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300 active:scale-[0.99]"
                    aria-label={trip.name}
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        {/* Title + small metric */}
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="text-base font-medium text-slate-900">
                            {trip.name}
                          </h2>
                          {/* Average rating badge */}
                          <RatingBadge rating={rating} isTH={isTH} />
                        </div>

                        {/* Badges */}
                        {trip.categoryNames?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {trip.categoryNames.map((cat) => (
                              <span
                                key={cat}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Short description */}
                        {trip.short && (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {trip.short}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </MainLayout>
  );
}

function RatingBadge({ rating, isTH }: { rating: RatingInfo | undefined; isTH: boolean }) {
  if (!rating) {
    // skeleton placeholder keeps layout stable
    return (
      <div className="h-6 w-28 shrink-0 rounded-full bg-slate-100" />
    );
  }
  const { avg, count } = rating;
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              "h-3.5 w-3.5 " +
              (i < full ? "fill-amber-400 text-amber-400" : i === full && half ? "text-amber-400" : "text-slate-300")
            }
          />
        ))}
      </div>
      <span className="font-semibold text-slate-900 tabular-nums">{avg.toFixed(2)}</span>
      <span className="opacity-70">{isTH ? `(${count} รีวิว)` : `(${count} reviews)`}</span>
    </div>
  );
}

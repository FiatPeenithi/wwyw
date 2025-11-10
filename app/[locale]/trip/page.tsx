// app/[locale]/trips/page.tsx  (Client Component)
"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import MainLayout from "@/app/components/main-layout";
import ListSkeleton from "@/app/components/skeletons/list-skeleton";
import { useRouter } from "next/navigation";
import LocationCard from "@/app/components/location-card";

type TripItem = {
  id: string;
  name: string;
  short: string;
  matchCount: number;
  categoryIds: string[];
  categoryNames: string[];
};

export default function TripsPage() {
  const t = useTranslations("Trips");
  const locale = useLocale();

  const [loading, setLoading] = useState<boolean>(true);
  const [trips, setTrips] = useState<TripItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const raw = localStorage.getItem("selectedCategories");
        const arr: Array<{ id: string }> = raw ? JSON.parse(raw) : [];
        const ids = arr.map((x) => x.id).filter(Boolean);

        if (ids.length === 0) {
          setTrips([]);
          return;
        }

        const qs = new URLSearchParams({
          categoryIds: ids.join(","),
          locale,
        });

        const res = await fetch(`/api/trips?${qs.toString()}`);

        if (!res.ok) {
          throw new Error("Failed to fetch trips");
        }

        const data: TripItem[] = await res.json();
        setTrips(data);
      } catch (e: any) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [locale]);

  return (
    <MainLayout loading={loading} loadingSlot={<ListSkeleton />}>
      
      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
          {t("error")}
        </div>
      )}

      {!loading && trips !== null && trips.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600">
          {t("empty")}
        </div>
      )}

      {!loading && trips && trips.length > 0 && (
        <>
        <LocationCard />
          {/* Header: mobile-first, ชัดเจน และกะทัดรัด */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("matchedCount", { count: trips.length })}
            </p>
          </div>

          {/* List: BG ขาว, เส้นขอบบาง, เงาอ่อน; เน้นสัมผัสมือถือ */}
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer"
                onClick={() => router.push(`/${locale}/trip/${trip.id}`)}
              >
                {/* เนื้อหา: จัดวางแบบคอลัมน์บนมือถือ และแยก Action ชัดเจน */}
                <div className="flex flex-col gap-3">
                  <div>
                    {/* Title */}
                    <h2 className="text-base font-medium text-slate-900">
                      {trip.name}
                    </h2>

                    {/* Badges: โทนรอง Slate, อ่านง่ายบนพื้นขาว */}
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

                    {/* Short description */}
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {trip.short}
                    </p>
                  </div>


                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </MainLayout>
  );
}

// app/[locale]/trip/[id]/page.tsx  (Client Component)
"use client";

import { useEffect, useMemo, useState, KeyboardEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/app/components/main-layout";
import ListSkeleton from "@/app/components/skeletons/list-skeleton";
import ListItem from "@/app/components/ListItem";
import { useLocale } from "next-intl";
import LocationCard from "@/app/components/location-card";

// === NEW: Reviews UI ===
import ReviewsList from "@/app/components/reviewsList";
import ReviewForm from "@/app/components/reviewForm";

type MinimalItem = { id: string; name: string; short: string; sorting?: number; thumbnail: string };
type TripDetail = {
  trip: { id: string; name: string; short: string };
  temples: MinimalItem[];
  communities: MinimalItem[];
};

// === NEW: Review types for UI ===
type ReviewItem = {
  id: string;
  name: string;
  email: string;
  comment: string;
  rating: number | null;
  trip_id: string;
  created_at: string;
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // === NEW: reviews state ===
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const id = params?.id;
  const locale = useLocale();

  // Load trip detail
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/trips/${id}?locale=${locale}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.json().catch(() => ({}));
          throw new Error(t?.error || `HTTP ${res.status}`);
        }

        const json = (await res.json()) as TripDetail;
        if (!cancelled) setData(json);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  // === NEW: load reviews of this trip ===
  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const res = await fetch(`/api/reviews?tripId=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}));
        throw new Error(t?.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { items: ReviewItem[] };
      setReviews(json.items ?? []);
    } catch (err: any) {
      setReviewsError(err?.message ?? "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const title = useMemo(() => data?.trip?.name ?? "Trip", [data]);

  if (loading) {
    return (
      <MainLayout loading loadingSlot={<ListSkeleton />}>
        <h1 className="sr-only">{title}</h1>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout loading={false}>
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
          <p className="truncate">{error}</p>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout loading={false}>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600">
          <h1 className="text-base font-semibold text-slate-900">ไม่พบข้อมูลทริป</h1>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout loading={false}>
      <LocationCard />

      {/* Page header */}
      <header className="my-4 bg-white p-4 rounded-xl">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          {data.trip.name}
        </h1>
        {data.trip.short && (
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {data.trip.short}
          </p>
        )}
      </header>

      {/* Temples */}
      <Section
        title={locale === "en" ? "Temples" : "วัด"}
        items={data.temples}
        locale={locale}
        onClick={(itemId) => router.push(`/temple/${itemId}?locale=${locale}`)}
      />

      {/* Communities */}
      <Section
        title={locale === "en" ? "Communities" : "ชุมชน"}
        items={data.communities}
        locale={locale}
        onClick={(itemId) => router.push(`/community/${itemId}?locale=${locale}`)}
      />

      {/* === NEW: Reviews === */}
      <section className="mt-8">

        <div className="grid gap-6">
          {/* List */}
            <ReviewsList
              items={reviews}
              loading={reviewsLoading}
              error={reviewsError}
            />

          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <ReviewForm
              tripId={data.trip.id}
              onSubmitted={async () => {
                await loadReviews(); // reload หลังบันทึกสำเร็จ
              }}
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function Section({
  title,
  items,
  locale,
  onClick,
}: {
  title: string;
  items: MinimalItem[];
  locale: string;
  onClick: (id: string) => void;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-medium text-slate-900">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          {locale === "en" ? "No data" : "ไม่มีข้อมูล"}
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <CardRow
                onActivate={() => onClick(item.id)}
                content={<ListItem name={item.name} short={item.short} thumbnail={item.thumbnail} />}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * CardRow
 */
function CardRow({
  onActivate,
  content,
}: {
  onActivate: () => void;
  content: React.ReactNode;
}) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={onKey}
      className="group cursor-pointer flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">{content}</div>

      {/* Chevron */}
      <svg
        className="ml-3 h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-slate-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

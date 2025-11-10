"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import MainLayout from "@/app/components/main-layout";
import ListSkeleton from "@/app/components/skeletons/list-skeleton";
import ListItem from "@/app/components/ListItem";
import { useLocale } from "next-intl";
import LocationCard from "@/app/components/location-card";

type MinimalItem = { id: string; name: string; short: string; sorting?: number; thumbnail: string };
type TripDetail = {
  trip: { id: string; name: string; short: string };
  temples: MinimalItem[];
  communities: MinimalItem[];
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params?.id;
  const locale = useLocale();

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

  const title = useMemo(() => data?.trip?.name ?? "Trip", [data]);

  if (loading) {
    return (
      <MainLayout loading loadingSlot={<ListSkeleton />}>
        <h1>{title}</h1>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout loading={false}>
        <h1>{title}</h1>
        <p style={{ color: "crimson" }}>เกิดข้อผิดพลาด: {error}</p>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout loading={false}>
        <h1>ไม่พบข้อมูลทริป</h1>
      </MainLayout>
    );
  }

  return (
    <MainLayout loading={false}>

          <LocationCard />

      <h1 className="text-xl font-bold">{data.trip.name}</h1>
      {data.trip.short && <p style={{ marginTop: 0, color: "#444" }}>{data.trip.short}</p>}

      {/* Temples */}
      <Section
        title={locale === "en" ? "Temples" : "วัด"}
        items={data.temples}
        locale={locale}
        onClick={(id) => router.push(`/temple/${id}?locale=${locale}`)}
      />

      {/* Communities */}
      <Section
        title={locale === "en" ? "Communities" : "ชุมชน"}
        items={data.communities}
        locale={locale}
        onClick={(id) => router.push(`/community/${id}?locale=${locale}`)}
      />
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
    <section style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>

      {items.length === 0 ? (
        <p style={{ color: "#666" }}>
          {locale === "en" ? "No data" : "ไม่มีข้อมูล"}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                cursor: "pointer",
              }}
              onClick={() => onClick(item.id)}
            >
              <ListItem name={item.name} short={item.short} thumbnail={item.thumbnail} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

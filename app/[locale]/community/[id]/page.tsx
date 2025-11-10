// app/communities/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/app/components/main-layout";
import GridSkeleton from "@/app/components/skeletons/grid-skeleton";
import { driveImageUrl } from "@/app/lib/drive-image";
import Image from "next/image";
import LocationCard from "@/app/components/location-card";

type CommunityView = {
  id: string;
  name: string;
  short?: string;
  history?: string;
  parking?: boolean | string;
  maps?: string;
  thumbnail?: string;
};

type RelatedTemple = {
  id: string;
  name: string;
} | null;

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

function toBool(v: any) {
  if (typeof v === "boolean") return v;
  if (!v) return false;
  return /^(1|true|yes|y)$/i.test(String(v).trim());
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [community, setCommunity] = useState<CommunityView | null>(null);
  const [temple, setTemple] = useState<RelatedTemple>(null);
  const [stores, setStores] = useState<StoreView[]>([]);

  const titleText = useMemo(
    () => (locale === "en" ? "Community Details" : "ข้อมูลชุมชน"),
    [locale]
  );
  const storesTitle = useMemo(
    () => (locale === "en" ? "Related Stores" : "ร้านค้าที่เกี่ยวข้อง"),
    [locale]
  );
  const relatedTempleLabel = useMemo(
    () => (locale === "en" ? "Related Temple" : "วัดที่เกี่ยวข้อง"),
    [locale]
  );

  const t = {
    phone: locale === "en" ? "Phone" : "โทร",
    parking: locale === "en" ? "Parking" : "ที่จอดรถ",
    haveParking: locale === "en" ? "Yes" : "มี",
    noParking: locale === "en" ? "No" : "ไม่มี",
    history: locale === "en" ? "History" : "ประวัติ",
    open: locale === "en" ? "Open" : "เปิด",
    close: locale === "en" ? "Close" : "ปิด",
    call: locale === "en" ? "Call" : "โทร",
    share: locale === "en" ? "Share" : "แชร์",
    direction: locale === "en" ? "Get Directions" : "เส้นทาง",
    noStores: locale === "en" ? "No stores." : "ไม่มีข้อมูลร้านค้า",
    readMore: locale === "en" ? "Read more" : "อ่านเพิ่มเติม",
    readLess: locale === "en" ? "Show less" : "ย่อ",
  } as const;

  useEffect(() => {
    let active = true;
    async function run() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/communities/${id}?locale=${locale}`, {
          next: { revalidate: 60 },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load community");
        if (!active) return;

        setCommunity(json.community);
        setTemple(json.temple);
        setStores(json.stores || []);
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

  const onShare = async () => {
    if (!community) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: community.name,
          text: community.short,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        });
      } else {
        await navigator.clipboard.writeText(
          typeof window !== "undefined" ? window.location.href : ""
        );
        alert(locale === "en" ? "Link copied" : "คัดลอกลิงก์แล้ว");
      }
    } catch {}
  };

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
      <div className="min-h-screen pb-24">
        {/* Sticky Header */}
        <header>
          <LocationCard />
          
        </header>

        {/* Hero */}
        <section className="relative">
          <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-300">
            {community?.thumbnail ? (
              <Image
                src={driveImageUrl(community.thumbnail)}
                alt={community?.name || ""}
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h2 className="text-2xl font-bold drop-shadow-lg mb-1">{community?.name}</h2>
            {community?.short ? (
              <p className="leading-relaxed line-clamp-3">{community.short}</p>
            ) : null}
          </div>
        </section>

        {/* Content */}
        <div className="px-4">
          {/* History */}
          {community?.history && (
            <section className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <h3 className="text-base font-semibold text-slate-900">
                  {t.history}
                </h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {community.history}
              </p>
            </section>
          )}

          {/* Quick Info Cards */}
          <section className="mt-4 grid grid-cols-2 gap-3">
            {/* แทนที่ maps ด้วยชื่อวัดที่เกี่ยวข้อง */}
            <QuickInfoCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9-4 9 4-9 4-9-4zm0 6l9 4 9-4" />
                </svg>
              }
              label={relatedTempleLabel}
              value={temple?.name || "-"}
              onClick={() => {
                if (temple?.id) router.push(`/temple/${temple.id}`);
              }}
              clickable={!!temple?.id}
            />

            {/* Parking */}
            <QuickInfoCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
              label={t.parking}
              value={toBool(community?.parking) ? t.haveParking : t.noParking}
            />
          </section>

          {/* Stores */}
          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h3 className="text-lg font-semibold text-slate-900">{storesTitle}</h3>
            </div>

            {stores.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
                {t.noStores}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {stores.map((s) => (
                  <StoreCard key={s.id} store={s} t={t} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom Action Bar — คงปุ่มเส้นทางไว้ (มาจาก community.maps), ไม่มี QuickInfoCard maps แล้ว */}
      {community?.maps && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-3 flex gap-3">
            <a
              href={community.maps}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium rounded-xl shadow-md active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {t.direction}
            </a>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// ——— UI Components ———
function QuickInfoCard({
  icon,
  label,
  value,
  onClick,
  clickable = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  clickable?: boolean;
}) {
  const content = (
    <div
      className={`bg-white rounded-xl p-3 shadow-sm border border-slate-200 hover:shadow-md transition-all ${clickable ? "cursor-pointer active:scale-[0.98]" : ""}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mb-1 text-amber-600">{icon}</div>
        <div className="text-sm uppercase tracking-wider text-slate-500 font-medium mb-0.5">
          {label}
        </div>
      </div>
      <div className="text-slate-900 truncate">{value || "-"}</div>
    </div>
  );
  return content;
}

function StoreCard({ store, t }: { store: StoreView; t: any }) {
  return (
    <div className="min-w-[280px] max-w-[280px] snap-center bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {store.thumbnail && (
        <div className="relative w-full aspect-[4/3] bg-slate-200">
          <Image
            src={driveImageUrl(store.thumbnail)}
            alt={store.name}
            fill
            sizes="280px"
            className="object-cover"
          />
        </div>
      )}

      <div className="p-3">
        <h4 className="font-semibold text-slate-900 leading-tight mb-1">{store.name}</h4>
        {store.short && (
          <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed mb-2">
            {store.short}
          </p>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {store.open_at ? (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-500">{t.open}:</span>
              <span className="ml-1 text-slate-900">{store.open_at}</span>
            </div>
          ) : null}

          {store.close_at ? (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-500">{t.close}:</span>
              <span className="ml-1 text-slate-900">{store.close_at}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex gap-2">
          {store.tel ? (
            <a
              href={`tel:${store.tel}`}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-lg shadow-md active:scale-95 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t.call}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// app/temples/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/app/components/main-layout";
import GridSkeleton from "@/app/components/skeletons/grid-skeleton";
import { driveImageUrl } from "@/app/lib/drive-image";
import Image from "next/image";
import Link from "next/link";
import LocationCard from "@/app/components/location-card";
import { getLocation } from "@/app/lib/storedLocation";
import { parseLatLngFromGoogleMapsUrl } from "@/app/lib/googleMaps";
import { navigationUri } from "@/app/lib/mapsNavigation";
import DriveCarousel from "@/app/components/driveCarousel";

// --- Types ---
type TempleView = {
  id: string;
  name: string;
  short: string;
  history: string;
  open_at: string;
  close_at: string;
  tel: string;
  parking: string;
  maps: string;
  thumbnail: string;
  album: string;
};

type SacredView = {
  id: string;
  category?: string;
  sorting?: string;
  isHighlight?: string | boolean;
  name: string;
  prayers?: string;
  worship?: string;
  thumbnail?: string;
};

type CommunityView = {
  id: string;
  name: string;
  short?: string;
  history?: string;
  parking?: string;
  maps: string;
  thumbnail?: string;
  highlight?: string | boolean;
};

// --- Helpers ---
function useExpandable(initialLines = 3) {
  const [expanded, setExpanded] = useState(false);
  const lineClamp = expanded ? "" : `line-clamp-${initialLines}`;
  return { expanded, setExpanded, lineClamp } as const;
}

export default function TempleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temple, setTemple] = useState<TempleView | null>(null);
  const [sacreds, setSacreds] = useState<SacredView[]>([]);
  const [communities, setCommunities] = useState<CommunityView[]>([]);

  // --- Fetch ---
  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/temples/${id}?locale=${locale}`, {
          next: { revalidate: 60 },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load temple");
        if (!active) return;

        const sac = (json.sacreds || json.sacred || []) as SacredView[];
        const comm = (json.communities || json.community || []) as CommunityView[];
        setTemple(json.temple);
        setSacreds(sac);
        setCommunities(comm);
      } catch (e: any) {
        if (active) setError(e?.message || "Unknown error");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) run();
    return () => {
      active = false;
    };
  }, [id, locale]);

  const titleText = useMemo(
    () => (locale === "en" ? "Temple Details" : "ข้อมูลวัด"),
    [locale]
  );
  const sacredTitle = useMemo(
    () => (locale === "en" ? "Sacred Items" : "สิ่งศักดิ์สิทธิ์"),
    [locale]
  );
  const communityTitle = useMemo(
    () => (locale === "en" ? "Communities" : "ชุมชนที่เกี่ยวข้อง"),
    [locale]
  );

  const { expanded, setExpanded, lineClamp } = useExpandable(3);

  // --- UI strings ---
  const t = {
    open: locale === "en" ? "Open" : "เปิด",
    close: locale === "en" ? "Close" : "ปิด",
    phone: locale === "en" ? "Phone" : "โทร",
    parking: locale === "en" ? "Parking" : "ที่จอดรถ",
    map: locale === "en" ? "Navigate" : "เริ่มเดินทาง",
    fromTemp: locale === "en" ? "Navigate from Temple" : "เริ่มเดินทางจากวัด",
    call: locale === "en" ? "Call" : "โทร",
    share: locale === "en" ? "Share" : "แชร์",
    highlight: locale === "en" ? "Highlight" : "ไฮไลท์",
    noSacred: locale === "en" ? "No sacred entries." : "ไม่มีข้อมูลสิ่งศักดิ์สิทธิ์",
    noCommunity: locale === "en" ? "No communities." : "ไม่มีข้อมูลชุมชน",
    readMore: locale === "en" ? "Read more" : "อ่านเพิ่มเติม",
    readLess: locale === "en" ? "Show less" : "ย่อ",
    history: locale === "en" ? "History" : "ประวัติ",
    prayers: locale === "en" ? "Prayers" : "บทสวด",
    worship: locale === "en" ? "Worship" : "วิธีบูชา",
    noParking: locale === "en" ? "No" : "ไม่มี",
    haveParking: locale === "en" ? "Yes" : "มี",
    view: locale === "en" ? "View" : "รายละเอียด",
  } as const;


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

        {/* Hero Image */}
        <section className="relative">
          <div className="relative w-full aspect-video">
            {temple?.album ? (
              <DriveCarousel folder={temple.album} />
            ) : null}
          </div>

          {/* Temple Name Overlay */}
          <div className="p-4 bg-white mt-4 rounded-xl border border-slate-200">
            <h2 className="text-xl font-bold drop-shadow-lg mb-1">{temple?.name}</h2>
            <p className={`leading-relaxed text-slate-500 ${lineClamp}`}>
              {temple?.short}
            </p>
          </div>
        </section>

        {temple?.history && (
          <section className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h3 className="text-base font-semibold text-slate-900">{t.history}</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {temple.history}
            </p>
          </section>
        )}
        {/* Content Container */}
        <div>

          {/* Quick Info Cards */}
          <section className="mt-4 grid grid-cols-2 gap-3">
            <QuickInfoCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label={t.open}
              value={temple?.open_at || "-"}
            />
            <QuickInfoCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label={t.close}
              value={temple?.close_at || "-"}
            />
            <QuickInfoCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
              label={t.phone}
              value={temple?.tel || "-"}
              isTel
            />
            <QuickInfoCard
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
              label={t.parking}
              value={temple?.parking ? t.haveParking : t.noParking}
            />
          </section>

          {/* Sacred Items */}
          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h3 className="text-lg font-semibold text-slate-900">{sacredTitle}</h3>
            </div>

            {sacreds.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
                {t.noSacred}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {sacreds.map((s) => (
                  <SacredCard key={s.id} sacred={s} locale={locale} t={t} />
                ))}
              </div>
            )}
          </section>

          {/* Communities */}
          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h3 className="text-lg font-semibold text-slate-900">{communityTitle}</h3>
            </div>

            {communities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
                {t.noCommunity}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {communities.map((c) => (

                  <CommunityCard key={c.id} community={c} t={t} templeMaps={temple?.maps} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {(temple?.maps || temple?.tel) && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-3 flex gap-3">
            {temple?.maps && (

              <button
                onClick={async () => {
                  const loc = getLocation();
                  const r = await fetch(`/api/expand?url=${encodeURIComponent(temple.maps)}`);
                  const { expanded } = await r.json();
                  const templeLoc = parseLatLngFromGoogleMapsUrl(expanded);
                  router.push(navigationUri(loc?.lat, loc?.lng, templeLoc?.lat, templeLoc?.lng))
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium rounded-xl shadow-md active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {t.map}
              </button>

            )}
            {temple?.tel && (
              <a
                href={`tel:${temple.tel}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-xl shadow-md active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {t.call}
              </a>
            )}
          </div>

        </div>
      )}
    </MainLayout>
  );
}

// --- UI Components ---
function QuickInfoCard({
  icon,
  label,
  value,
  isTel = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isTel?: boolean;
}) {
  const content = (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mb-1 text-amber-600">{icon}</div>
        <div className="text-sm uppercase tracking-wider text-slate-500 font-medium mb-0.5">
          {label}
        </div>
      </div>
      <div className="text-slate-900 truncate">{value}</div>
    </div>
  );

  if (isTel && value && value !== "-") {
    return (
      <a href={`tel:${value}`} className="block">
        {content}
      </a>
    );
  }
  return content;
}

function SacredCard({
  sacred,
  locale,
  t,
}: {
  sacred: SacredView;
  locale: string;
  t: any;
}) {
  return (
    <div className="min-w-[280px] max-w-[280px] snap-center bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {sacred.thumbnail && (
        <div className="relative w-full aspect-[4/3] bg-slate-200">
          <Image
            src={driveImageUrl(sacred.thumbnail)}
            alt={sacred.name}
            fill
            sizes="280px"
            className="object-cover"
          />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-slate-900 leading-tight">{sacred.name}</h4>
          {(String(sacred.isHighlight) === "yes" || sacred.isHighlight === true) && (
            <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase tracking-wider rounded-full">
              {t.highlight}
            </span>
          )}
        </div>

        {sacred.category && (
          <p className="text-xs text-slate-600 mb-2">{sacred.category}</p>
        )}

        {sacred.prayers && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold mb-1">
              {t.prayers}
            </div>
            <p className="text-xs text-slate-700 line-clamp-2">{sacred.prayers}</p>
          </div>
        )}

        {sacred.worship && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold mb-1">
              {t.worship}
            </div>
            <p className="text-xs text-slate-700 line-clamp-2">{sacred.worship}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityCard({ templeMaps, community, t }: { templeMaps?: string; community: CommunityView; t: any }) {
  const router = useRouter();
  return (
    <div
      className="min-w-[280px] max-w-[280px] snap-center bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200"
    >
      {community.thumbnail && (
        <div className="relative w-full aspect-4/3 bg-slate-200">
          <Image
            src={driveImageUrl(community.thumbnail)}
            alt={community.name}
            fill
            sizes="280px"
            className="object-cover"
          />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-slate-900 leading-tight">{community.name}</h4>
        </div>

        {community.short && (
          <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
            {community.short}
          </p>
        )}

        <button
          onClick={async () => {
            try {
              const [tRes, cRes] = await Promise.all([
                fetch(`/api/expand?url=${encodeURIComponent(templeMaps || "")}`),
                fetch(`/api/expand?url=${encodeURIComponent(community.maps)}`),
              ]);

              if (!tRes.ok || !cRes.ok) {
                throw new Error("expand API failed");
              }

              const tJson = await tRes.json();
              const cJson = await cRes.json();

              // รองรับหลายชื่อ field จาก API ที่อาจต่างกัน
              const tempExpanded =
                tJson.expandedTemp ?? tJson.expanded ?? tJson.expandedUrl ?? tJson.url;
              const commuExpanded =
                cJson.expanded ?? cJson.expandedTemp ?? cJson.expandedUrl ?? cJson.url;

              if (!tempExpanded || !commuExpanded) {
                throw new Error("expanded URL missing");
              }

              const tempLoc = parseLatLngFromGoogleMapsUrl(String(tempExpanded));
              const commuLoc = parseLatLngFromGoogleMapsUrl(String(commuExpanded));

              if (!tempLoc || !commuLoc) {
                throw new Error("cannot parse lat/lng from expanded URL");
              }

              router.push(
                navigationUri(tempLoc.lat, tempLoc.lng, commuLoc.lat, commuLoc.lng)
              );
            } catch (err) {
              console.error(err);
              // จะแจ้งผู้ใช้หรือล็อกอย่างเดียวก็ได้
              // alert("เกิดข้อผิดพลาดในการสร้างเส้นทาง");
            }
          }}
          className="flex-1 text-xs w-full mb-2 flex items-center justify-center gap-2 py-3 px-2 mt-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium rounded-lg active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          {t.fromTemp}
        </button>

        <Link
          href={`/community/${community.id}`}
          className="flex-1 text-xs flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-lg active:scale-95 transition-all"
        >

          {t.view}
        </Link>

      </div>
    </div>
  );
}
// components/ReviewList.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Star, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { useLocale } from "next-intl";

export type Review = {
  id: string;
  trip_id: string;
  name: string;
  email: string;
  comment: string;
  rating: number | null;
  created_at: string;
};

export default function ReviewList({
  items,
  loading,
  error,
}: {
  items: Review[];
  loading: boolean;
  error: string | null;
}) {
  const locale = useLocale();
  const isTH = locale?.startsWith("th");

  const average = useMemo(() => {
    return items.length > 0
      ? Number(
          (
            items.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) /
            items.length
          ).toFixed(2)
        )
      : 0;
  }, [items]);

  const total = items.length;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: false,
    loop: false,
    align: "start",
    containScroll: false,
    skipSnaps: false,
    slidesToScroll: 1,
  });

  const [index, setIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setIndex(api.selectedScrollSnap());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", () => onSelect(emblaApi));
    emblaApi.on("reInit", () => onSelect(emblaApi));
  }, [emblaApi, onSelect]);

  const scrollTo = (i: number) => emblaApi?.scrollTo(i);
  const onPrev = () => emblaApi?.scrollPrev();
  const onNext = () => emblaApi?.scrollNext();

  const fmtRelative = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const abs = Math.abs(diffMs);
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ["year", 1000 * 60 * 60 * 24 * 365],
      ["month", 1000 * 60 * 60 * 24 * 30],
      ["week", 1000 * 60 * 60 * 24 * 7],
      ["day", 1000 * 60 * 60 * 24],
      ["hour", 1000 * 60 * 60],
      ["minute", 1000 * 60],
    ];
    const rtf = new Intl.RelativeTimeFormat(locale || "en", {
      numeric: "auto",
    });
    for (const [unit, ms] of units) {
      if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
    }
    return isTH ? "เมื่อสักครู่" : "just now";
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-7 w-24 rounded-lg bg-slate-200 animate-pulse" />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-amber-200 animate-pulse" />
            <div className="h-5 w-16 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-10/12 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="mt-2 h-3 w-16 rounded bg-amber-200 animate-pulse" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-9/12 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <div>
          <div className="font-medium">
            {isTH ? "เกิดข้อผิดพลาดในการโหลดรีวิว" : "Failed to load reviews"}
          </div>
          <div className="text-sm opacity-90">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-x-hidden bg-white p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">
          {isTH ? "รีวิว" : "Reviews"}
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-900">{average}</span>
            <span className="opacity-70 ml-4">
              {isTH ? `${total} รายการ` : `${total} reviews`}
            </span>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="relative">
        
          <div ref={emblaRef} className="overflow-hidden">
            <ul className="flex w-full mx-auto">
              {items.map((r) => (
                <li key={r.id} className="flex-[0_0_100%] md:flex-[0_0_32%] mx-2">
                  <ReviewItem review={r} fmtRelative={fmtRelative} isTH={!!isTH} />
                </li>
              ))}
            </ul>
          </div>

          {total > 1 && (
            <div className="mt-2 flex justify-center gap-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  aria-label={isTH ? `ไปที่สไลด์ ${i + 1}` : `Go to slide ${i + 1}`}
                  onClick={() => scrollTo(i)}
                  className={`h-1.5 w-4 rounded-full transition-all ${
                    i === index ? "bg-amber-500" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewItem({
  review,
  fmtRelative,
  isTH,
}: {
  review: Review;
  fmtRelative: (iso: string) => string;
  isTH: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const rating = Number(review.rating) || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-medium text-slate-900">
            {review.name}
          </div>
          <div className="truncate text-sm text-slate-500">{review.email}</div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                "h-3 w-3 " +
                (i < rating ? "fill-amber-400 text-amber-400" : "text-slate-300")
              }
            />
          ))}
        </div>
      </div>

      <CommentBlock text={review.comment} expanded={expanded} />

      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <span>{fmtRelative(review.created_at)}</span>
      </div>

      {review.comment && review.comment.length > 120 && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm active:scale-[0.99]"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              {isTH ? "ย่อรีวิว" : "Show less"} <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              {isTH ? "อ่านเพิ่มเติม" : "Read more"} <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function CommentBlock({
  text,
  expanded,
}: {
  text: string;
  expanded: boolean;
}) {
  if (!text) return null;
  return (
    <p
      className={
        "mt-3 whitespace-pre-wrap break-words text-slate-800 " +
        (expanded ? "" : "line-clamp-4")
      }
    >
      {text}
    </p>
  );
}

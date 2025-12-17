"use client";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { driveImageUrl } from "@/app/lib/drive-image";

type ImageItem = {
  id: string;
  name: string;
  src: string;
  thumb?: string;
  view: string;
};

export default function DriveCarousel({ folder }: { folder: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
  });

  const [items, setItems] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลจาก API
  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch(`/api/drive-images?folder=${encodeURIComponent(folder)}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setItems(d || []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [folder]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;

    const interval = setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi]);

  if (loading)
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );

  if (!items.length)
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
        No images found
      </div>
    );

  return (
    <div className="embla w-full h-full overflow-hidden bg-slate-200 relative group">
      <div className="embla__viewport w-full h-full" ref={emblaRef}>
        <div className="embla__container flex w-full h-full">
          {items.map((img, index) => {
            // ใช้ thumbnail size ใหญ่แทนรูปจริง เพื่อความเร็ว
            // w1200 น่าจะพอสำหรับ full width มือถือ/tablet
            const optimizedSrc = driveImageUrl(img.id, {
              useThumbnail: true,
              size: "w1200",
            });

            return (
              <div
                key={img.id}
                className="embla__slide flex-[0_0_100%] min-w-0 relative w-full h-full"
              >
                <Image
                  src={optimizedSrc}
                  alt={img.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                  priority={index === 0} // รูปแรกโหลดก่อน
                />

                {/* คลิเพื่อดูรูปเต็ม (Optional) */}
                <a
                  href={img.view}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 z-10"
                  aria-label={`View ${img.name}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation dots could go here if needed */}
    </div>
  );
}

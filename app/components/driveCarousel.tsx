"use client";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

type ImageItem = {
  id: string;
  name: string;
  src: string;
  thumb?: string;
  view: string;
};

export default function DriveCarousel({ folder }: { folder: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,      // เปิด loop เพื่อให้ auto-play หมุนต่อเนื่อง
    dragFree: false, // ปิด dragFree เพื่อให้ slide เป็นทีละหน้า
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
    }, 5000); // 3 วินาทีต่อ slide

    return () => clearInterval(interval);
  }, [emblaApi]);

  if (loading)
    return <div className="text-sm opacity-70">กำลังโหลดรูป…</div>;
  if (!items.length)
    return <div className="text-sm opacity-70">ไม่พบรูปในโฟลเดอร์</div>;

  return (
    <div className="embla w-full overflow-hidden">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container flex">
          {items.map((img) => (
            <a
              key={img.id}
              href={img.view}
              target="_blank"
              rel="noreferrer"
              title={img.name}
              className="embla__slide flex-[0_0_100%]"
            >
              <img
                src={img.src}
                alt={img.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

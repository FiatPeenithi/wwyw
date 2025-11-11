"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

type StoredLocation = {
  lat: number;
  lng: number;
  name?: string;
  source: "current" | "pin" | "search";
  savedAt: number;
};

function LocationCard() {
  const t = useTranslations("Location");

  const [location, setLocation] = useState<StoredLocation | null>(null);
  const router = useRouter();
  const locale = useLocale()

  useEffect(() => {
    try {
      const raw = localStorage.getItem("startLocation");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setLocation(parsed as StoredLocation);
      }
    } catch (err) {
      console.error("Invalid startLocation in localStorage", err);
    }
  }, []);

  return (
    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm mb-5">
      <div>
        <p className="text-lg font-medium text-slate-700">
          {t("startLocation")}
        </p>
        <p className="text-slate-600 text-sm mt-1 line-clamp-2">
          {location?.name || t("noSetup")}
        </p>
      </div>
      <button
      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition font-medium"
      onClick={() => router.push(`/${locale}/location`)}
      >
        <Settings />
      </button>
    </div>
  );
}

export default LocationCard;

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import MainLayout from "@/app/components/main-layout";
import { driveImageUrl } from "@/app/lib/drive-image";
import GridSkeleton from "@/app/components/skeletons/grid-skeleton";

// Types (all string fields)
export type Category = {
  id: string;
  category_th: string;
  category_en: string;
  thumbnail: string;
};

type ApiResponse = { categories: Category[] };

const STORAGE_KEY = "selectedCategories"; // save 1-2 categories as JSON array

export default function CategorySelectPage() {
  const locale = useLocale();
  const t = useTranslations("Category");

  const [data, setData] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [overLimit, setOverLimit] = useState(false); // ✅ show tailwind-only alert when > 2

  // Load saved selection from localStorage (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Category[];
        const ids = Array.isArray(parsed) ? parsed.map((c) => c?.id).filter(Boolean) : [];
        setSelectedIds(ids.slice(0, 2));
      }
    } catch {}
  }, []);

  // Fetch categories
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) throw new Error("Network error");
        const json = (await res.json()) as ApiResponse;
        if (!alive) return;
        setData(json.categories || []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to fetch");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const nameKey = useMemo(() => (locale === "th" ? "category_th" : "category_en"), [locale]);

  const limitReached = selectedIds.length >= 2;

  const toast = (ms = 2200) => {
    setOverLimit(true);
    const t = setTimeout(() => setOverLimit(false), ms);
    return () => clearTimeout(t);
  };

  const toggleSelect = (cat: Category) => {
    setJustSaved(false);
    setSelectedIds((prev) => {
      // already selected → deselect
      if (prev.includes(cat.id)) {
        return prev.filter((id) => id !== cat.id);
      }
      // trying to add 3rd → block and show alert
      if (prev.length >= 2) {
        toast();
        return prev; // do not change
      }
      return [...prev, cat.id];
    });
  };

  const handleSave = () => {
    if (!data) return;
    const selected = selectedIds
      .map((id) => data.find((c) => c.id === id))
      .filter(Boolean) as Category[];

    // force all-string fields
    const payload = selected.map((cat) => ({
      id: String(cat.id ?? ""),
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setJustSaved(true);
  };

  // ✅ Allow saving when at least 1 and at most 2 selected
  const canSave = selectedIds.length >= 1 && selectedIds.length <= 2;

  if (error) {
    return (
      <MainLayout loading={false} mainClassName="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-red-600">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout loading={loading} loadingSlot={<GridSkeleton />}>      
      {/* Over-limit alert (Tailwind only) */}
      <div
        role="alert"
        aria-live="polite"
        className={`pointer-events-none fixed left-1/2 top-4 z-[60] -translate-x-1/2 transform transition-opacity duration-300 ${
          overLimit ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="rounded-lg bg-amber-600/95 text-white px-4 py-2 shadow-lg">
          {locale === "th" ? "เลือกได้สูงสุด 2 รายการ" : "You can select up to 2 items."}
        </div>
      </div>

      {/* Header */}
      <div className="w-full py-6 grid space-y-4 justify-center text-center">
        <h2 className="text-2xl md:text-4xl font-bold">{t("title")}</h2>
        <p className="text-sm md:text-lg text-slate-500">{t("subtitle")}</p>
      </div>

      {/* Mobile-first grid */}
      {!loading && (
        <>
          <ul className="grid grid-cols gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
            {data?.map((cat) => {
              const selected = selectedIds.includes(cat.id);
              const label = (cat as any)[nameKey] as string;
              const disabled = !selected && limitReached; // block picking a 3rd
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleSelect(cat)}
                    className={`group w-full cursor-pointer overflow-hidden bg-white rounded-2xl border transition ease-out ${
                      selected
                        ? "border-amber-600 ring-1 ring-amber-600"
                        : "border-slate-200 hover:border-slate-300"
                    } p-4 sm:p-5 hover:scale-105 hover:border-amber-600 hover:ring-1 hover:ring-amber-600 ${
                      disabled ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    aria-pressed={selected}
                    aria-label={label}
                  >
                    <div className="mx-auto relative bg-slate-50 rounded-full w-24 h-24 sm:w-28 sm:h-28">
                      {cat.thumbnail ? (
                        <Image
                          src={driveImageUrl(cat.thumbnail, { useThumbnail: true, size: "w512" })}
                          alt={label}
                          fill
                          className="object-cover rounded-full"
                          sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">
                          No image
                        </div>
                      )}
                      {selected && (
                        <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-amber-600 pointer-events-none" />
                      )}
                    </div>
                    <p className="mt-3 text-center text-lg font-medium sm:text-lg">
                      {label}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="my-8 flex justify-center">
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 font-medium transition ${
                canSave
                  ? "bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              {t("btnNext")}
            </button>
          </div>
        </>
      )}
    </MainLayout>
  );
}

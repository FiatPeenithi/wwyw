"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function BackButton() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Common");

  const isRoot = pathname === `/${locale}`;

  // ตรวจว่า browser มี history ให้ย้อนหรือไม่
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // ถ้า history ยาวกว่า 1 แปลว่าย้อนกลับได้จริง
    if (window.history.length > 1) {
      setCanGoBack(true);
    }
  }, []);

  if (isRoot) return null;

  const onClick = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push(`/${locale}`);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.97] shadow-sm transition"
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="text-sm font-medium">
        {t("back")}
      </span>
    </button>
  );
}

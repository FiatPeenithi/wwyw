import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { useLocale } from "next-intl";

export function BackButton() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const isRoot = pathname === `/${locale}`;
  if (isRoot) return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-white cursor-pointer"
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Back</span>
    </button>
  );
}


import { Languages } from "lucide-react";

export function LanguageSwitch({
  locale,
  onLanguageChange,
}: {
  locale: string;
  onLanguageChange: (checked: boolean) => void;
}) {
  const isThai = locale === "th";

  return (
    <div className="border border-slate-300 p-4 w-auto rounded-lg bg-white">
      <button
      type="button"
      onClick={() => onLanguageChange(!isThai)}
      className="flex items-center gap-2 select-none"
    >
      <span className="text-sm font-medium">EN</span>
      <div
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors bg-amber-500
          }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isThai ? "translate-x-6" : "translate-x-1"
            }`}
        />
      </div>
      <span className="text-sm font-medium">TH</span>
    </button>
    </div>
  );
}


import { Languages } from "lucide-react";

export function LanguageToggle({ locale, onLanguageChange }: { 
  locale: string; 
  onLanguageChange: (checked: boolean) => void;
}) {
  const isThai = locale === "th";
  const nextLocale = isThai ? "en" : "th";

  return (
    <button
      onClick={() => onLanguageChange(!isThai)}
      className="flex items-center gap-2"
    >
        <Languages />
      {isThai ? "TH" : "EN"}
    </button>
  );
}
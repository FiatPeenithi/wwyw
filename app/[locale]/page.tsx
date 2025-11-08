'use client'
import { useLocale, useTranslations } from "next-intl";
import { LanguageToggle } from "../components/language-switch";
import { usePathname, useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const onLanguageChange = (checked: boolean) => {
    const newLocale = checked ? 'th' : 'en';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };
  const t = useTranslations();
  return (
    <div>
      <LanguageToggle locale={locale} onLanguageChange={onLanguageChange} />
      <h1>{t('HomePage.title')}</h1>

    </div>
  );
}

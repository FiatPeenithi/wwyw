'use client'

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { LanguageSwitch } from '../components/language-switch';
import { usePathname, useRouter } from 'next/navigation';

export default function Home() {
  const t = useTranslations('HomePage');
const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const onLanguageChange = (checked: boolean) => {
        const newLocale = checked ? 'th' : 'en';
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Background image */}
      <Image
        src="https://travel.mthai.com/app/uploads/2019/05/1498710820_19818.jpg"
        alt="Background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Overlay layers */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />

      {/* Top-right language switch */}
      <header className="absolute top-6 right-6 z-20">
        <LanguageSwitch locale={locale} onLanguageChange={onLanguageChange} />
      </header>

      {/* Centered hero content */}
      <main className="relative z-10 flex items-center justify-center min-h-dvh">
        <div className="text-center px-6 max-w-3xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-md">
            {t('title')}
          </h1>

          <p className="mt-4 text-2xl sm:text-3xl text-white/90 drop-shadow-md">
            {t('subtitle')}
          </p>

          <p className="mt-2 text-lg sm:text-xl text-white/80 drop-shadow">
            {t('short')}
          </p>

          <button
            className="mt-8 inline-flex items-center rounded-lg bg-amber-500 px-6 py-3 text-lg text-white font-semibold shadow hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
            aria-label={t('btn')}
            onClick={() => router.push(`/${locale}/category`)}
          >
            {t('btn')}
          </button>
        </div>
      </main>
    </div>
  );
}

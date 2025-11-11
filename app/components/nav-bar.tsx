import { useLocale } from "next-intl";
import { LanguageSwitch } from "../components/language-switch";
import { usePathname, useRouter } from "next/navigation";
import { BackButton } from "./back-btn";
import Link from "next/link";

function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const onLanguageChange = (checked: boolean) => {
        const newLocale = checked ? 'th' : 'en';
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };
    return (
        <div className="px-6 py-4 flex justify-between items-center bg-amber-700">
            <div>
                <BackButton />
            </div>
            <Link href="/">
                <h1 className="text-2xl font-bold text-slate-100">W(h)at</h1>
            </Link>
            <LanguageSwitch locale={locale} onLanguageChange={onLanguageChange} />
        </div>
    )
}

export default NavBar
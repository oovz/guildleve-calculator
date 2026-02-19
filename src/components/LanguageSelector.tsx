'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const locales = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh-Hans', label: '简体中文', flag: '🇨🇳' },
] as const;

export function LanguageSelector() {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();

    const handleLocaleChange = (newLocale: string) => {
        // Replace the locale segment in the current path
        const segments = pathname.split('/');
        segments[1] = newLocale; // First segment after / is the locale
        const newPath = segments.join('/');
        router.push(newPath);
    };

    const currentLocaleData = locales.find(l => l.code === currentLocale) || locales[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentLocaleData.flag} {currentLocaleData.label}</span>
                    <span className="sm:hidden">{currentLocaleData.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.code}
                        onClick={() => handleLocaleChange(locale.code)}
                        className={currentLocale === locale.code ? 'bg-muted' : ''}
                    >
                        <span className="mr-2">{locale.flag}</span>
                        {locale.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

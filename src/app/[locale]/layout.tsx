import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales } from '@/lib/i18n/routing';
import { Toaster } from '@/components/ui/sonner';

import { notFound } from 'next/navigation';
import { TooltipManager } from "@/components/ui/TooltipManager";
import { SettingsProvider } from '@/lib/context/SettingsContext';
import { ThemeProvider } from "@/components/theme-provider";
import { PriceOverrideProvider } from "@/lib/context/PriceOverrideContext";

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function Layout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    if (!(locales as readonly string[]).includes(locale)) {
        notFound();
    }

    // Enable static rendering for next-intl
    setRequestLocale(locale);

    const messages = await getMessages();

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <SettingsProvider>
                    <PriceOverrideProvider>
                        <TooltipManager />
                        <Toaster />
                        <div className="h-screen flex flex-col overflow-hidden">
                            <main className="flex-1 min-h-0">
                                {children}
                            </main>
                        </div>
                    </PriceOverrideProvider>
                </SettingsProvider>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}

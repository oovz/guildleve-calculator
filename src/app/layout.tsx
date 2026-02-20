
import { ThemeProvider } from "@/components/theme-provider";
import { AppUpdater } from "@/components/feature/AppUpdater";
import { Toaster } from "@/components/ui/sonner";
import { SettingsProvider } from "@/lib/context/SettingsContext";
import { PriceOverrideProvider } from "@/lib/context/PriceOverrideContext";
import { Metadata } from "next";

import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL('https://oovz.github.io/guildleve-calculator/'),
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.json`,
  title: "Guildleve Calculator - FFXIV Profit & Leveling",
  description: "Optimize your FFXIV Grand Company Leves for maximum Gil profit and XP efficiency. Supported for Global and CN servers.",
  keywords: ["FFXIV", "Leve", "Calculator", "Profit", "Leveling", "Crafter", "DoH", "Gil", "XP"],
  authors: [{ name: "OOVZ Team" }],
  openGraph: {
    title: "Guildleve Calculator",
    description: "Maximize your FFXIV Gil and XP with real-time market data.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-display antialiased bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 min-h-screen transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <PriceOverrideProvider>
              <AppUpdater />
              {children}
              <Toaster />
            </PriceOverrideProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

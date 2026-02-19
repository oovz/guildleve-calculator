
/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { useSettings } from '@/lib/context/SettingsContext';
import { UserPreferences } from '@/types/user-preferences';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { JOBS, JobId } from '@/types/job';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Globe, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';

const DATACENTERS_GROUPED = {
    'North America': ['Aether', 'Primal', 'Crystal', 'Dynamis'],
    'Europe': ['Chaos', 'Light'],
    'Japan': ['Elemental', 'Gaia', 'Mana', 'Meteor'],
    'Oceania': ['Materia'],
    'China': ['陆行鸟', '猫小胖', '莫古力', '豆豆柴']
};

interface SettingsPanelProps {
    customTrigger?: React.ReactNode;
}

// REGION_MAPPING removed

export function SettingsPanel({ customTrigger }: SettingsPanelProps) {
    const { preferences, updatePreferences } = useSettings();
    const { selectedJobProfit, datacenter, jobLevels } = preferences;
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Settings');
    const currentLocale = useLocale() as 'en' | 'zh-Hans';

    const handleLanguageChange = (newLang: 'en' | 'zh-Hans') => {
        const updates: Partial<UserPreferences> = { language: newLang };
        const cnDCs = ['陆行鸟', '猫小胖', '莫古力', '豆豆柴'];
        const globalDCs = ['Aether', 'Primal', 'Crystal', 'Dynamis', 'Chaos', 'Light', 'Elemental', 'Gaia', 'Mana', 'Meteor', 'Materia'];

        if (newLang === 'zh-Hans') {
            if (!datacenter || globalDCs.includes(datacenter)) {
                updates.datacenter = '猫小胖';
            }
        } else if (newLang === 'en') {
            if (cnDCs.includes(datacenter)) {
                updates.datacenter = 'Primal';
            }
        }

        updatePreferences(updates);
        const localePrefix = newLang;
        const path = pathname.replace(/^\/[^\/]+/, `/${localePrefix}`);
        router.push(path);
    };

    const toggleJob = (jobId: JobId) => {
        const current = selectedJobProfit || [];
        const isSelected = current.includes(jobId);
        let newSelection: JobId[];

        if (isSelected) {
            newSelection = current.filter(id => id !== jobId);
        } else {
            newSelection = [...current, jobId];
        }
        updatePreferences({ selectedJobProfit: newSelection });
    };

    const handleLevelChange = (jobId: string, level: number) => {
        const val = Math.max(1, Math.min(100, level));
        updatePreferences({
            jobLevels: {
                ...jobLevels,
                [jobId]: val
            }
        });
    };

    const handleProfileChange = (profile: 'edge' | 'balanced' | 'strict') => {
        const updates: Partial<UserPreferences> = { marketProfile: profile };

        if (profile === 'edge') {
            updates.maxStaleHours = 72;
            updates.minListings = 1;
            updates.useHistoryVerification = false;
        } else if (profile === 'balanced') {
            updates.maxStaleHours = 24;
            updates.minListings = 5;
            updates.useHistoryVerification = true;
        } else if (profile === 'strict') {
            updates.maxStaleHours = 12;
            updates.minListings = 8;
            updates.useHistoryVerification = true;
        }

        updatePreferences(updates);
    };

    const isAllSelected = selectedJobProfit.length === Object.keys(JOBS).length;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {customTrigger || (
                    <Button variant="outline" size="icon" aria-label={t('title')}>
                        <SettingsIcon className="h-5 w-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-background border-border p-0 overflow-hidden shadow-2xl rounded-sm">
                <div className="p-8 pb-4">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-foreground text-background rounded-sm shadow-lg">
                                <SettingsIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">{t('appSettings')}</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Configure application preferences, market data defense profiles, and localized settings.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-8 pb-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                    {/* 1. Region & Appearance */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Globe className="w-4 h-4 text-accent-cool" />
                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">{t('regionAppearance')}</h4>
                        </div>
                        <div className="bg-muted/30 p-5 rounded-sm border border-border space-y-5">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                        {t('interfaceLanguage')}
                                    </Label>
                                    <Select
                                        value={currentLocale}
                                        onValueChange={(val) => handleLanguageChange(val as 'en' | 'zh-Hans')}
                                    >
                                        <SelectTrigger className="h-10 rounded-sm bg-background border-border font-bold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm border-border shadow-2xl bg-popover z-[60]">
                                            <SelectItem value="en" className="font-bold py-3 text-sm">English</SelectItem>
                                            <SelectItem value="zh-Hans" className="font-bold py-3 text-sm">简体中文</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                        {t('theme')}
                                    </Label>
                                    <div className="flex bg-background p-1 rounded-sm border border-border h-10">
                                        {[
                                            { id: 'light', icon: Sun },
                                            { id: 'dark', icon: Moon },
                                            { id: 'system', icon: Monitor }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setTheme(opt.id)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center rounded-sm transition-all duration-300",
                                                    theme === opt.id
                                                        ? "bg-foreground text-background shadow-md"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <opt.icon className="w-3.5 h-3.5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    {t('datacenterLabel')}
                                </Label>
                                <Select
                                    value={datacenter}
                                    onValueChange={(val) => updatePreferences({ datacenter: val })}
                                >
                                    <SelectTrigger className="h-10 rounded-sm bg-background border-border font-bold text-sm">
                                        <SelectValue placeholder={t('datacenterPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] rounded-sm border-border shadow-2xl bg-popover z-[60]">
                                        {Object.entries(DATACENTERS_GROUPED).map(([region, dcs], idx) => (
                                            <React.Fragment key={region}>
                                                <div className={cn(
                                                    "px-3 py-2 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] border-l-2 border-l-accent-cool/60 bg-muted/40",
                                                    idx > 0 && "mt-1 border-t border-border/30"
                                                )}>
                                                    {region}
                                                </div>
                                                {dcs.map(dc => (
                                                    <SelectItem key={dc} value={dc} className="font-bold py-2.5 text-sm pl-6">{dc}</SelectItem>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </section>

                    {/* 2. Market Controls */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Shield className="w-4 h-4 text-accent-cool" />
                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">{t('marketControls')}</h4>
                        </div>
                        <div className="bg-muted/30 p-5 rounded-sm border border-border space-y-5">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('marketProfile')}</Label>
                                <Select
                                    value={preferences.marketProfile || 'balanced'}
                                    onValueChange={(val) => handleProfileChange(val as 'edge' | 'balanced' | 'strict')}
                                >
                                    <SelectTrigger className="h-10 rounded-sm bg-background border-border font-bold text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-sm border-border shadow-2xl bg-popover z-[60]">
                                        <SelectItem value="edge" className="font-bold py-2 text-sm">{t('profileEdge')}</SelectItem>
                                        <SelectItem value="balanced" className="font-bold py-2 text-sm">{t('profileBalanced')}</SelectItem>
                                        <SelectItem value="strict" className="font-bold py-2 text-sm">{t('profileStrict')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[9px] text-muted-foreground italic px-0.5 leading-tight">{t('profileHelp')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('staleThreshold')}</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={preferences.maxStaleHours || 24}
                                            onChange={(e) => updatePreferences({ maxStaleHours: parseInt(e.target.value) || 24 })}
                                            className="h-10 rounded-sm bg-background border-border font-bold text-sm pl-4 pr-10"
                                        />
                                        <span className="absolute right-3 top-3 text-[9px] font-black text-muted-foreground/40 uppercase">{t('hoursUnit')}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('minListings')}</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={preferences.minListings || 5}
                                            onChange={(e) => updatePreferences({ minListings: parseInt(e.target.value) || 0 })}
                                            className="h-10 rounded-sm bg-background border-border font-bold text-sm pl-4 pr-10"
                                        />
                                        <span className="absolute right-3 top-3 text-[9px] font-black text-muted-foreground/40 uppercase">{t('minUnit')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('allowBuyerHistoryFallback')}</Label>
                                    <Select
                                        value={preferences.allowBuyerHistoryFallback ? "true" : "false"}
                                        onValueChange={(val) => updatePreferences({ allowBuyerHistoryFallback: val === "true" })}
                                    >
                                        <SelectTrigger className="h-10 rounded-sm bg-background border-border font-bold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm border-border shadow-2xl bg-popover z-[60]">
                                            <SelectItem value="true" className="font-bold py-2 text-sm">{t('yes')}</SelectItem>
                                            <SelectItem value="false" className="font-bold py-2 text-sm">{t('noStrict')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('allowSellerHistoryFallback')}</Label>
                                    <Select
                                        value={preferences.allowSellerHistoryFallback ? "true" : "false"}
                                        onValueChange={(val) => updatePreferences({ allowSellerHistoryFallback: val === "true" })}
                                    >
                                        <SelectTrigger className="h-10 rounded-sm bg-background border-border font-bold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm border-border shadow-2xl bg-popover z-[60]">
                                            <SelectItem value="true" className="font-bold py-2 text-sm">{t('yes')}</SelectItem>
                                            <SelectItem value="false" className="font-bold py-2 text-sm">{t('noStrict')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-3 bg-accent-cool/5 p-4 rounded-sm border border-accent-cool/10">
                                <Info className="w-4 h-4 text-accent-cool/60 shrink-0" />
                                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter italic">
                                    {t('marketControlsHelp')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Currency Rates */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <span className="material-icons-round text-base text-accent-cool">payments</span>
                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">{t('currencyRates')}</h4>
                        </div>
                        <div className="bg-muted/30 p-5 rounded-sm border border-border">
                            <div className="space-y-3">
                                {[
                                    { label: t('sealsRate'), key: 'seals', default: 2.0 },
                                    { label: t('scripsRate'), key: 'scrips', default: 1.5 },
                                    { label: t('gemstonesRate'), key: 'gemstones', default: 50.0 }
                                ].map((rate) => (
                                    <div key={rate.key} className="flex items-center justify-between gap-4">
                                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] shrink-0">
                                            {rate.label}
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={(preferences.currencyRates as Record<string, number>)?.[rate.key] || rate.default}
                                            onChange={(e) => updatePreferences({
                                                currencyRates: {
                                                    ...preferences.currencyRates,
                                                    seals: preferences.currencyRates?.seals || 2.0,
                                                    scrips: preferences.currencyRates?.scrips || 1.5,
                                                    gemstones: preferences.currencyRates?.gemstones || 50.0,
                                                    [rate.key]: parseFloat(e.target.value) || 0
                                                }
                                            })}
                                            className="h-9 w-24 rounded-sm bg-background border-border font-mono font-black text-xs text-center"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <Separator className="opacity-50" />

                    {/* 4. Job Management */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">{t('levelConfig')}</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const allJobs = Object.keys(JOBS) as JobId[];
                                    updatePreferences({ selectedJobProfit: isAllSelected ? [] : allJobs });
                                }}
                                className="h-7 text-[10px] font-black text-accent-cool uppercase hover:bg-accent-cool/5"
                            >
                                {isAllSelected ? t('deselectAll') : t('selectAll')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-4">
                            {Object.values(JOBS).map((job) => {
                                const isEnabled = selectedJobProfit.includes(job.id as JobId);
                                const level = jobLevels[job.id] || 100;
                                const jobClass = `job-icon-${job.id.toLowerCase()}`;

                                return (
                                    <div key={job.id} className={cn(
                                        "flex items-center gap-3 p-2.5 rounded-sm border transition-all duration-300",
                                        isEnabled
                                            ? "bg-accent-blue/10 border-accent-blue/30"
                                            : "opacity-30 grayscale hover:opacity-100 hover:grayscale-0 border-transparent"
                                    )}>
                                        <button
                                            onClick={() => toggleJob(job.id as JobId)}
                                            className={cn(
                                                "w-9 h-9 rounded-sm flex items-center justify-center shrink-0 p-1.5 transition-all duration-300",
                                                jobClass,
                                                isEnabled ? "shadow-inner" : "shadow-none"
                                            )}
                                        >
                                            {job.iconUrl ? (
                                                <img src={job.iconUrl} alt={job.id} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-[10px] font-black text-white">{job.id}</span>
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-foreground block mb-1 uppercase truncate" title={JOBS[job.id as JobId] ? (JOBS[job.id as JobId].name[currentLocale] || JOBS[job.id as JobId].name.en) : job.id}>
                                                {JOBS[job.id as JobId] ? (JOBS[job.id as JobId].name[currentLocale] || JOBS[job.id as JobId].name.en) : job.id}
                                            </span>
                                            <Input
                                                type="number"
                                                value={level}
                                                onChange={(e) => handleLevelChange(job.id, parseInt(e.target.value) || 1)}
                                                className="h-7 rounded-sm bg-background border-border font-mono font-black text-[10px] px-2"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

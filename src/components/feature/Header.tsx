
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { useSettings } from '@/lib/context/SettingsContext';
import { JOBS, JobId, Job } from '@/types/job';
import { cn } from '@/lib/utils';
import { SettingsPanel } from './SettingsPanel';
import { useTranslations } from 'next-intl';
import { History, RefreshCw, Settings, TrendingUp, DollarSign, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
    onRefresh: () => void;
    isRefreshing: boolean;
    lastUpdated: Date | null;
}

export function Header({ onRefresh, isRefreshing, lastUpdated }: HeaderProps) {
    const { preferences, updatePreferences } = useSettings();
    const { mode, selectedJobProfit, levelingJobId, language } = preferences;
    const t = useTranslations('Page');
    const tFilter = useTranslations('FilterBar');
    const tCommon = useTranslations('Common');
    const tSettings = useTranslations('Settings');

    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatRelativeTime = (date: Date | null): string => {
        if (!date) return tCommon('never');
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return tCommon('justNow');
        if (diffMins < 60) return tCommon('minutesAgo', { minutes: diffMins });
        if (diffHours < 24) return tCommon('hoursAgo', { hours: diffHours });
        return tCommon('daysAgo', { days: Math.floor(diffHours / 24) });
    };

    const getAgeColor = (date: Date | null): string => {
        if (!date) return 'text-slate-400';
        const diffMs = new Date().getTime() - date.getTime();
        const diffHours = diffMs / 3600000;
        if (diffHours <= 2) return 'text-emerald-500';
        if (diffHours <= 12) return 'text-amber-500';
        return 'text-red-500';
    };

    const handleJobToggle = (jobId: JobId) => {
        if (mode === 'profit') {
            const current = new Set(selectedJobProfit);
            if (current.has(jobId)) {
                current.delete(jobId);
            } else {
                current.add(jobId);
            }
            updatePreferences({ selectedJobProfit: Array.from(current) });
        } else {
            updatePreferences({ levelingJobId: jobId });
        }
    };

    const isJobActive = (jobId: JobId) => {
        if (mode === 'profit') {
            return selectedJobProfit.includes(jobId);
        } else {
            return levelingJobId === jobId;
        }
    };

    const getJobName = (job: Job) => {
        return job.name[language] || job.name.en || job.id;
    };

    const activeJobCount = mode === 'profit' ? selectedJobProfit.length : (levelingJobId ? 1 : 0);
    const totalJobCount = Object.keys(JOBS).length;

    return (
        <header className="flex flex-col gap-2 p-3 bg-card border-b border-border shadow-none py-2 shrink-0 h-auto relative z-40">
            <div className="flex items-center justify-between gap-2 lg:gap-4 h-auto min-h-[40px]">
                {/* Left: Modes */}
                <div className="flex bg-muted p-0.5 rounded-sm border border-border shrink-0">
                    <button
                        onClick={() => updatePreferences({ mode: 'profit' })}
                        title={tFilter('modeProfit')}
                        className={cn(
                            "px-2 sm:px-4 py-1 rounded-sm flex items-center gap-1 sm:gap-1.5 transition-all text-xs font-black uppercase tracking-tighter",
                            mode === 'profit'
                                ? "bg-background text-foreground shadow-md scale-105"
                                : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                        )}
                    >
                        <DollarSign className={cn("w-3 h-3", mode === 'profit' ? "text-emerald-500" : "")} />
                        <span className="hidden lg:inline">{tFilter('modeProfit')}</span>
                    </button>
                    <button
                        onClick={() => updatePreferences({ mode: 'leveling' })}
                        title={tFilter('modeLeveling')}
                        className={cn(
                            "px-2 sm:px-4 py-1 rounded-sm flex items-center gap-1 sm:gap-1.5 transition-all text-xs font-black uppercase tracking-tighter",
                            mode === 'leveling'
                                ? "bg-background text-foreground shadow-md scale-105"
                                : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                        )}
                    >
                        <TrendingUp className={cn("w-3 h-3", mode === 'leveling' ? "text-secondary" : "")} />
                        <span className="hidden lg:inline">{tFilter('modeLeveling')}</span>
                    </button>
                </div>

                {/* Middle: Jobs Selection (Adaptive) */}
                <div className="flex-1 flex items-center justify-center min-w-0">
                    {/* Desktop View: Full Icons */}
                    <div className="hidden xl:flex items-center justify-center gap-1.5 px-2 overflow-x-auto no-scrollbar">
                        {Object.values(JOBS).map((job) => (
                            <button
                                key={job.id}
                                onClick={() => handleJobToggle(job.id as JobId)}
                                title={getJobName(job)}
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 border transition-all duration-200 rounded-sm shrink-0",
                                    isJobActive(job.id as JobId)
                                        ? "bg-accent-blue/10 border-accent-blue/40 shadow-sm scale-105 z-10"
                                        : "bg-muted/5 border-transparent opacity-40 grayscale hover:opacity-70 hover:grayscale-0 hover:scale-95"
                                )}
                            >
                                {job.iconUrl ? (
                                    <img
                                        src={job.iconUrl}
                                        alt={job.id}
                                        className={cn(
                                            "w-5 h-5 sm:w-6 sm:h-6 object-contain",
                                            isJobActive(job.id as JobId) ? "grayscale-0" : "grayscale"
                                        )}
                                    />
                                ) : (
                                    <span className={cn("text-[11px] font-black", isJobActive(job.id as JobId) ? "text-secondary" : "text-muted-foreground")}>
                                        {job.id.slice(0, 3)}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Mobile/Tight View: Dropdown Button */}
                    <div className="xl:hidden flex items-center w-full justify-start px-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border bg-muted/30 hover:bg-muted transition-colors text-xs font-black uppercase tracking-widest text-foreground">
                                    <span className="truncate max-w-[120px]">
                                        {tSettings('jobsSelected', { count: activeJobCount, total: totalJobCount })}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 bg-popover border-border rounded-sm shadow-xl z-[50]">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
                                    {tSettings('levelConfig')}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.values(JOBS).map((job) => (
                                    <DropdownMenuCheckboxItem
                                        key={job.id}
                                        checked={isJobActive(job.id as JobId)}
                                        onCheckedChange={() => handleJobToggle(job.id as JobId)}
                                        className="py-2.5 font-bold text-sm cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={job.iconUrl} alt={job.id} className="w-5 h-5 object-contain" />
                                            <span>{getJobName(job)}</span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <div className={cn("hidden xl:flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] mr-2", getAgeColor(lastUpdated))}>
                        <History className="w-3 h-3 opacity-60" />
                        <span>{formatRelativeTime(lastUpdated)}</span>
                    </div>

                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        title={t('refresh')}
                        className="h-8 px-2 flex items-center gap-2 rounded-sm border border-border bg-muted hover:bg-accent hover:text-foreground transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-3 h-3 text-muted-foreground", isRefreshing && "animate-spin")} />
                        <span className="hidden md:inline text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                            {isRefreshing ? t('refreshing') : t('refresh')}
                        </span>
                    </button>

                    <SettingsPanel customTrigger={
                        <button className="flex items-center justify-center h-8 w-8 rounded-sm bg-foreground text-background text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                    } />
                </div>
            </div>
        </header>
    );
}

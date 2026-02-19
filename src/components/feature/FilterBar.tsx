
'use client';

/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOBS, JobId, Job } from '@/types/job';
import { useTranslations, useLocale } from 'next-intl';

export interface FilterBarProps {
    className?: string;

    // Common
    searchTerm: string;
    onSearchChange: (term: string) => void;
    mode: 'profit' | 'leveling';
    onModeChange: (mode: 'profit' | 'leveling') => void;

    // Profit Mode Filters
    minLevel: number;
    onMinLevelChange: (level: number) => void;
    maxLevel: number;
    onMaxLevelChange: (level: number) => void;

    // Leveling Mode Filters
    levelingJobId: JobId | null;
    onLevelingJobChange: (job: JobId) => void;
    currentLevel: number;
    onCurrentLevelChange: (level: number) => void;

    children?: React.ReactNode;
}

export function FilterBar({
    className,
    searchTerm,
    onSearchChange,

    mode,
    onModeChange,

    minLevel,
    onMinLevelChange,
    maxLevel,
    onMaxLevelChange,

    levelingJobId,
    onLevelingJobChange,
    currentLevel,
    onCurrentLevelChange,

    children
}: FilterBarProps) {
    const t = useTranslations('FilterBar');
    const locale = useLocale();
    const getJobName = (job: Job) => {
        const name = job.name as unknown as Record<string, string | undefined>;
        return name?.[locale] || name?.['zh-Hans'] || name?.en || job.id;
    };

    return (
        <div className={`flex flex-col gap-4 p-4 bg-card rounded-lg border shadow-sm ${className || ''}`}>

            {/* Top Row: Mode & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">

                {/* Mode Switch */}
                <div className="grid grid-cols-2 bg-muted p-1 rounded-lg w-full md:w-auto">
                    <Button
                        variant={mode === 'profit' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onModeChange('profit')}
                        className="gap-2"
                    >
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('modeProfit')}</span>
                    </Button>
                    <Button
                        variant={mode === 'leveling' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onModeChange('leveling')}
                        className="gap-2"
                    >
                        <GraduationCap className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('modeLeveling')}</span>
                    </Button>
                </div>

                {/* Search Input */}
                <div className="flex-1 w-full md:w-auto space-y-1.5 md:min-w-[300px]">
                    <Label htmlFor="search-filter" className="sr-only">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search-filter"
                            placeholder={t('searchPlaceholder')}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-2">
                    {children}
                </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-4 border-t pt-4">

                {mode === 'profit' ? (
                    /* Profit Mode Filters: Range */
                    <div className="flex items-center gap-2">
                        <div className="space-y-1.5 w-24">
                            <Label htmlFor="min-level" className="text-xs text-muted-foreground">{t('minLevel')}</Label>
                            <Input
                                id="min-level"
                                type="number"
                                min={1}
                                max={100}
                                value={minLevel}
                                onChange={(e) => onMinLevelChange(Number(e.target.value))}
                                className="h-8"
                            />
                        </div>
                        <span className="pt-6 text-muted-foreground">-</span>
                        <div className="space-y-1.5 w-24">
                            <Label htmlFor="max-level" className="text-xs text-muted-foreground">{t('maxLevel')}</Label>
                            <Input
                                id="max-level"
                                type="number"
                                min={1}
                                max={100}
                                value={maxLevel}
                                onChange={(e) => onMaxLevelChange(Number(e.target.value))}
                                className="h-8"
                            />
                        </div>
                    </div>
                ) : (
                    /* Leveling Mode Filters: Job & Current Level */
                    <div className="flex items-center gap-4 flex-1">
                        <div className="space-y-1.5 min-w-[140px]">
                            <Label htmlFor="leveling-job" className="text-xs text-muted-foreground">{t('jobLabel')}</Label>
                            <Select
                                value={levelingJobId || ''}
                                onValueChange={(val) => onLevelingJobChange(val as JobId)}
                            >
                                <SelectTrigger id="leveling-job" className="h-8">
                                    <SelectValue placeholder={t('jobPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(JOBS).map(job => (
                                        <SelectItem key={job.id} value={job.id}>
                                            <div className="flex items-center gap-2">
                                                {/* Requires Icon */}
                                                <span>{getJobName(job)}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 w-24">
                            <Label htmlFor="current-level" className="text-xs text-muted-foreground">{t('myLevel')}</Label>
                            <Input
                                id="current-level"
                                type="number"
                                min={1}
                                max={100}
                                value={currentLevel}
                                onChange={(e) => onCurrentLevelChange(Number(e.target.value))}
                                className="h-8"
                            />
                        </div>
                    </div>
                )}

                {/* Mobile Actions */}
                <div className="md:hidden flex items-center gap-2 ml-auto w-full justify-end mt-2">
                    {children}
                </div>
            </div>
        </div>
    );
}

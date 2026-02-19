'use client';

import React, { useMemo, useEffect, useState, useDeferredValue, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import { useGameData } from '@/hooks/useGameData';
import { useSettings } from '@/lib/context/SettingsContext';
import { useMarketData } from '@/hooks/useMarketData';
import { Header } from '@/components/feature/Header';
import { Sidebar } from '@/components/feature/Sidebar';
import { rankLeves, RankingContext } from '@/lib/services/ranking';
import { usePriceOverrides } from '@/lib/context/PriceOverrideContext';
import { JOB_ID_MAPPING } from '@/types/job';
import { RankedLeveResult } from '@/types/calculation';
import { Input } from '@/components/ui/input';
import { Search, Info, Package } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LeveList } from '@/components/feature/LeveList';

export default function HomePage() {
    const { leves, items, recipes, isLoading: dataLoading, error: dataError } = useGameData();
    const { preferences, isLoading: settingsLoading } = useSettings();
    const { marketData, loading: marketLoading, lastUpdated: marketLastUpdated, refreshMarketData } = useMarketData();
    const { overrides } = usePriceOverrides();
    const t = useTranslations('Page');
    const tCommon = useTranslations('Common');
    const tFilter = useTranslations('FilterBar');
    useLocale();

    // Local Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);

    // Selected leve ID 
    const [selectedLeveId, setSelectedLeveId] = useState<number | null>(null);
    const [localOverrides, setLocalOverrides] = useState<Record<number, { price: number; source: 'market' | 'npc' | 'manual' | 'craft' }>>({});

    // 1. Rank and Calculate
    const rankedResults = useMemo(() => {
        if (dataLoading || settingsLoading) return [];

        const leveList = Object.values(leves);
        if (leveList.length === 0) return [];

        // Determine effective selected jobs based on mode
        let effectiveSelectedJobs: string[] = [];
        if (preferences.mode === 'profit') {
            effectiveSelectedJobs = preferences.selectedJobProfit;
        } else {
            effectiveSelectedJobs = preferences.levelingJobId ? [preferences.levelingJobId] : [];
        }

        // Prepare Ranking Context
        const rankingContext = {
            mode: preferences.mode,
            leves: leveList,
            marketData: marketData,
            items: items,
            recipes: recipes || {},
            jobLevels: preferences.jobLevels,
            selectedJobs: effectiveSelectedJobs,
            priceOverrides: overrides,
            currencyRates: preferences.currencyRates,
            sortBy: preferences.mode === 'leveling' ? 'xp' : 'profit',
            sourcePreference: preferences.sourcePreference,
            settings: preferences
        } as RankingContext;

        return rankLeves(rankingContext);
    }, [leves, marketData, items, recipes, preferences, dataLoading, settingsLoading, overrides]);


    // 2. Compute Item IDs to fetch market data for
    const itemIdsToFetch = useMemo(() => {
        if (dataLoading || settingsLoading || !preferences.setupCompleted) return [];

        const leveList = Object.values(leves);
        if (leveList.length === 0) return [];

        let effectiveSelectedJobs: string[] = [];
        if (preferences.mode === 'profit') {
            effectiveSelectedJobs = preferences.selectedJobProfit;
        } else {
            effectiveSelectedJobs = preferences.levelingJobId ? [preferences.levelingJobId] : [];
        }

        const JOB_ID_MAPPING: Record<number, string> = {
            9: 'CRP', 10: 'BSM', 11: 'ARM', 12: 'GSM',
            13: 'LTW', 14: 'WVR', 15: 'ALC', 16: 'CUL',
        };

        const filteredLevesForFetching = leveList.filter(leve => {
            const jobStr = JOB_ID_MAPPING[leve.jobId];
            return jobStr && effectiveSelectedJobs.includes(jobStr);
        });

        const itemIds = new Set<number>();

        const addIngredients = (itemId: number, depth = 0) => {
            if (depth > 4) return;
            const recipe = recipes[itemId];
            if (recipe) {
                recipe.ingredients.forEach(ing => {
                    if (!itemIds.has(ing.itemId)) {
                        itemIds.add(ing.itemId);
                        addIngredients(ing.itemId, depth + 1);
                    }
                });
            }
        };

        filteredLevesForFetching.forEach(leve => {
            if (leve.requiredItemId) {
                itemIds.add(leve.requiredItemId);
                addIngredients(leve.requiredItemId);
            }
            if (leve.bonusRewards) {
                leve.bonusRewards.forEach(b => b.items.forEach(bi => itemIds.add(bi.itemId)));
            }
        });

        return Array.from(itemIds);
    }, [leves, recipes, preferences.mode, preferences.selectedJobProfit, preferences.levelingJobId, preferences.setupCompleted, dataLoading, settingsLoading]);

    // 3. Refresh Market Data when itemIdsToFetch or datacenter changes
    useEffect(() => {
        if (itemIdsToFetch.length === 0) return;
        const datacenter = preferences.datacenter;
        if (!datacenter) return;

        refreshMarketData(datacenter, itemIdsToFetch);
    }, [itemIdsToFetch, preferences.datacenter, refreshMarketData]);


    // 4. Client-Side Filters
    const filteredResults = useMemo(() => {
        return rankedResults.filter(r => {
            const l = r.calculation.leve;

            if (deferredSearchTerm) {
                const term = deferredSearchTerm.toLowerCase();
                const nameEn = l.name.en.toLowerCase();
                const nameZh = l.name['zh-Hans']?.toLowerCase() || '';
                const item = items[l.requiredItemId];
                const itemNameEn = item?.name.en.toLowerCase() || '';
                const itemNameZh = item?.name['zh-Hans']?.toLowerCase() || '';

                return nameEn.includes(term) || nameZh.includes(term) ||
                    itemNameEn.includes(term) || itemNameZh.includes(term);
            }

            return true;
        });
    }, [rankedResults, deferredSearchTerm, items]);

    // 5. Improved Focus Item logic (Bug Fix for Selection Mismatch)
    const focusItem = useMemo(() => {
        if (selectedLeveId !== null) {
            // First check if it's in the CURRENT filtered results (best UX: keeping focus in view)
            const resultInFilters = filteredResults.find(r => r.calculation.leve.id === selectedLeveId);
            if (resultInFilters) return resultInFilters;

            // If not in filters, check if it's still valid for CURRENT job settings (even if hidden by search)
            const resultInRanked = rankedResults.find(r => r.calculation.leve.id === selectedLeveId);
            if (resultInRanked) return resultInRanked;

            // If it's gone from rankedResults (e.g. job switched away), then we MUST update/clear
        }

        // Default to first item in filtered list if nothing selected or selection invalidated
        return filteredResults.length > 0 ? filteredResults[0] : null;
    }, [selectedLeveId, filteredResults, rankedResults]);

    // 6. Focused Item with Local Overrides
    const focusItemWithLocalOverrides = useMemo(() => {
        if (!focusItem) return null;
        if (Object.keys(localOverrides).length === 0) return focusItem;

        // Perform a single-leve re-calculation with local overrides merged on top of global overrides
        const priceOnlyOverrides: Record<number, number> = {};
        Object.entries(localOverrides).forEach(([id, ov]) => {
            priceOnlyOverrides[Number(id)] = ov.price;
        });

        const mergedOverrides = { ...overrides, ...priceOnlyOverrides };
        const leve = focusItem.calculation.leve;

        // Diagnostic log
        logger.debug(`[Page] Re-calculating ${leve.name.en} with local overrides:`, localOverrides);

        const rankingContext = {
            mode: preferences.mode,
            leves: [leve], // Just this one
            marketData: marketData,
            items: items,
            recipes: recipes || {},
            jobLevels: preferences.jobLevels,
            selectedJobs: [JOB_ID_MAPPING[leve.jobId] || ''],
            priceOverrides: mergedOverrides,
            currencyRates: preferences.currencyRates,
            sourcePreference: preferences.sourcePreference,
            settings: preferences
        } as RankingContext;

        const res = rankLeves(rankingContext);
        const finalResult = res.length > 0 ? res[0] : focusItem;

        if (Object.keys(localOverrides).length > 0) {
            logger.debug(`[Page] Overridden Profit: ${finalResult.calculation.optimalProfit}`);
        }

        return finalResult;
    }, [focusItem, localOverrides, marketData, items, recipes, preferences, overrides]);


    // Handlers
    const handleRefresh = useCallback(() => {
        logger.info('[Page] Manual force refresh triggered');
        if (itemIdsToFetch.length > 0) {
            refreshMarketData(preferences.datacenter, itemIdsToFetch, true);
        }
    }, [itemIdsToFetch, preferences.datacenter, refreshMarketData]);

    const handleLeveClick = useCallback((result: RankedLeveResult) => {
        const id = result.calculation.leve.id;
        if (id !== selectedLeveId) {
            setSelectedLeveId(id);
            setLocalOverrides({});
        }

        // Log calculation details to console
        if (result.calculationLogs && result.calculationLogs.length > 0) {
            console.groupCollapsed(`%c[Calc] ${result.calculation.leve.name.en} Details`, 'color: #10b981; font-weight: bold;');
            result.calculationLogs.forEach(log => console.log(log));
            console.groupEnd();
        }
    }, [selectedLeveId]);

    if (dataLoading || settingsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-zinc-800 border-t-accent-cool"
                        />
                    </div>
                    <p className="text-slate-500 font-medium animate-pulse">{tCommon('loadingData')}</p>
                </div>
            </div>
        );
    }

    if (dataError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 px-4">
                <Card className="max-w-md border-destructive/20 shadow-xl bg-white dark:bg-zinc-900">
                    <CardHeader className="flex flex-row items-center gap-4 text-destructive">
                        <div className="bg-destructive/10 p-2 rounded-full">
                            <Info className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">{tCommon('errorLoading')}</CardTitle>
                            <CardDescription className="text-destructive/80">Network error or invalid data</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm bg-destructive/5 p-3 rounded border border-destructive/10 font-mono">
                            {(dataError as Error)?.message || String(dataError)}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 dark:bg-[#09090b] selection:bg-accent-cool/30 transition-colors duration-500 flex flex-col">
            <main className="mx-auto max-w-[1600px] px-4 py-4 md:px-6 lg:px-6 w-full lg:flex-1 lg:min-h-0 flex flex-col">

                {/* 1. Unified Bento Header */}
                <Header
                    onRefresh={handleRefresh}
                    isRefreshing={marketLoading}
                    lastUpdated={marketLastUpdated}
                />

                <div className="mt-2 flex flex-col lg:grid lg:grid-cols-12 gap-2 items-stretch lg:flex-1 lg:min-h-0 h-auto lg:overflow-hidden px-2 lg:px-0">
                    {/* 1. Left Column: Details (Col 5) */}
                    <aside className="lg:col-span-5 h-auto lg:h-full lg:overflow-y-auto flex flex-col z-20">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={focusItem?.calculation.leve.id || 'empty'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <Sidebar
                                    bestResult={focusItemWithLocalOverrides}
                                    isLoading={marketLoading}
                                    localOverrides={localOverrides}
                                    setLocalOverride={(itemId: number, price: number, source: 'market' | 'npc' | 'manual' | 'craft') => {
                                        setLocalOverrides(prev => {
                                            const existing = prev[itemId];
                                            if (existing && existing.price === price && existing.source === source) {
                                                const next = { ...prev };
                                                delete next[itemId];
                                                return next;
                                            }
                                            return { ...prev, [itemId]: { price, source } };
                                        });
                                    }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </aside>

                    {/* 2. Right Column: List & Browser (Col 7) */}
                    <section className="lg:col-span-7 bg-card rounded-sm border border-border flex flex-col h-auto lg:h-full lg:overflow-hidden relative z-10 shadow-none min-h-[600px] lg:min-h-0">
                        <div className="p-3 border-b border-border bg-muted/20 shrink-0">
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-baseline gap-2">
                                        <Package className="w-3 h-3 text-muted-foreground opacity-50" />
                                        <h3 className="font-black text-xs text-foreground uppercase tracking-[0.2em]">{t('leveListings')}</h3>
                                        <span className="text-[10px] font-black text-muted-foreground/60 tracking-wider font-mono">
                                            {filteredResults.length} RECORDS
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-80">
                                        {t('sortedBy', { mode: preferences.mode === 'profit' ? tFilter('modeProfit') : tFilter('modeLeveling') })}
                                    </div>
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                                    <Input
                                        placeholder={t('searchList')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-1.5 bg-background border-border rounded-sm text-xs font-bold focus:ring-1 focus:ring-border transition-all placeholder:text-muted-foreground/40 h-8 uppercase tracking-wider"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Leve List Container: Using absolute filling to ensure virtualization works */}
                        <div id="leve-list-container" className="lg:flex-1 min-h-[600px] lg:min-h-0 relative bg-background">
                            <div className="absolute inset-0">
                                <LeveList
                                    results={filteredResults}
                                    onLeveClick={handleLeveClick}
                                    selectedLeveId={focusItem?.calculation.leve.id}
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

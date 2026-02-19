
import { Leve } from '@/types/leve';
import { LeveCalculation, RankedLeveResult } from '@/types/calculation';
import { calculateProfit } from '@/lib/calculation/profit';
import { calculateXP } from '@/lib/calculation/xp';
import { calculateBonusEV } from '@/lib/calculation/bonus-ev';
import { calculateCraftingCost } from '@/lib/calculation/crafting-cost';
import { JOBS, JobId, JOB_ID_MAPPING } from '@/types/job';
import { Item, MarketListing } from '@/types/item';
import { Recipe } from '@/types/recipe';
import { analyzeMarketData } from '@/lib/services/market-analysis';
import { logger } from '@/lib/logger';

import { UserPreferences } from '@/types/user-preferences';

export type RankingMode = 'profit' | 'leveling';

export interface RankingContext {
    mode: RankingMode;
    leves: Leve[];
    marketData: Record<number, MarketListing | null>;
    items: Record<string, Item>; // needed for calculations
    recipes: Record<string, Recipe>; // needed for crafting cost
    jobLevels: Record<string, number>; // JobId -> Level
    selectedJobs: string[]; // JobIds
    sortBy?: 'profit' | 'xp' | 'ratio'; // Default to mode-based
    priceOverrides?: Record<number, number>;
    currencyRates?: {
        seals: number;
        scrips: number;
        gemstones: number;
    };
    sourcePreference?: 'optimal' | 'npc' | 'market';
    settings?: UserPreferences;
}


export function rankLeves(context: RankingContext): RankedLeveResult[] {
    const startTime = Date.now();
    logger.debug(`[Ranking] Starting calculation for ${context.leves.length} leves in ${context.mode} mode...`);
    const results: RankedLeveResult[] = [];

    for (const leve of context.leves) {
        // Filter by Job
        const jobStr = JOB_ID_MAPPING[leve.jobId];
        if (!jobStr || !context.selectedJobs.includes(jobStr)) continue;

        // Filter by Level
        if (context.mode === 'leveling') {
            const jobLevel = context.jobLevels[jobStr] || 100;
            if (leve.level > jobLevel) continue;
        }

        // Calculate
        const item = context.items[leve.requiredItemId];
        if (!item) {
            logger.debug(`[Ranking] Missing item definition for Leve ${leve.name.en} (Item ${leve.requiredItemId})`);
            continue;
        }

        const market = context.marketData[item.id] || null;

        // Profit Calc (Apply Overrides)
        const profitResult = calculateProfit(leve, market, context.settings, context.priceOverrides);

        // XP Calc
        const xpResult = calculateXP(leve);

        // Bonus EV
        const bonusEVResult = calculateBonusEV(leve.bonusRewards, context.marketData, leve.turnins, context.items, context.settings);
        const bonusEV = bonusEVResult.totalExpectedValue;

        // Market Analysis
        const marketAnalysis = analyzeMarketData(market, leve.requiredQty, false, false, context.settings);

        // Crafting Cost (Apply Overrides)
        const calcContext = {
            recipes: context.recipes,
            items: context.items,
            market: context.marketData,
            overrides: context.priceOverrides,
            currencyRates: context.currencyRates,
            sourcePreference: context.sourcePreference,
            settings: context.settings
        };
        let craftingBreakdown = calculateCraftingCost(item.id, leve.requiredQty * leve.turnins, calcContext);

        // Determine Net Profit for NQ/HQ by picking best acquisition method
        const isUntrustworthy = marketAnalysis.isUntrustworthy;
        const markCostNQ = profitResult.costNQ;
        const markCostHQ = profitResult.costHQ;

        let bestBuyNQ = markCostNQ;

        // If we can buy HQ cheaper than NQ, we should use that for "Buy NQ" scenario (turning in HQ as NQ is allowed)
        if (markCostHQ !== null) {
            if (bestBuyNQ === null || markCostHQ < bestBuyNQ) {
                bestBuyNQ = markCostHQ;
            }
        }

        const npcPrice = item.npcPrice;
        const npcCost = npcPrice !== null ? npcPrice * leve.requiredQty * leve.turnins : null;

        if (npcCost !== null) {
            if (bestBuyNQ === null || npcCost < bestBuyNQ) {
                bestBuyNQ = npcCost;
            }
        }

        const costCraft = craftingBreakdown?.craftingCost ?? null;

        // 4 Scenarios for Profit
        // 1. Craft -> Turn in HQ
        const profitCraftHQ = costCraft !== null ? (profitResult.revenueHQ - costCraft + bonusEV) : -Infinity;

        // 2. Buy HQ -> Turn in HQ
        const profitBuyHQ = markCostHQ !== null ? (profitResult.revenueHQ - markCostHQ + bonusEV) : -Infinity;

        // 3. Craft -> Turn in NQ
        const profitCraftNQ = costCraft !== null ? (profitResult.revenueNQ - costCraft + bonusEV) : -Infinity;

        // 4. Buy NQ -> Turn in NQ
        const profitBuyNQ = bestBuyNQ !== null ? (profitResult.revenueNQ - bestBuyNQ + bonusEV) : -Infinity;

        const logs: string[] = [];
        const log = (msg: string) => {
            logs.push(msg);
            // Optionally still send to logger.debug, but the user wants to avoid console clogging
            // logger.debug(msg); 
        };

        log(`[Calculation] Leve: ${leve.name.en} (${jobStr} Lvl ${leve.level})`);
        log(`  - Revenue: NQ=${profitResult.revenueNQ}, HQ=${profitResult.revenueHQ}`);
        log(`  - Bonus EV: ${bonusEV.toFixed(2)}`);
        log(`  - Costs: MarketNQ=${markCostNQ ?? 'N/A'}, MarketHQ=${markCostHQ ?? 'N/A'}, NPC=${npcCost ?? 'N/A'}, Craft=${costCraft ?? 'N/A'}`);
        if (isUntrustworthy) log(`  - [!] Market data is UNTRUSTWORTHY (Score: ${marketAnalysis.reliabilityScore})`);
        log(`  - Scenarios:`);
        log(`    1. Craft HQ -> Profit: ${profitCraftHQ === -Infinity ? 'N/A' : profitCraftHQ.toFixed(0)}`);
        log(`    2. Buy HQ   -> Profit: ${profitBuyHQ === -Infinity ? 'N/A' : profitBuyHQ.toFixed(0)}`);
        log(`    3. Craft NQ -> Profit: ${profitCraftNQ === -Infinity ? 'N/A' : profitCraftNQ.toFixed(0)}`);
        log(`    4. Buy NQ   -> Profit: ${profitBuyNQ === -Infinity ? 'N/A' : profitBuyNQ.toFixed(0)}`);

        // Identify Net Profit
        const netProfitHQ = Math.max(profitCraftHQ, profitBuyHQ);
        const netProfitNQ = Math.max(profitCraftNQ, profitBuyNQ);

        const safeNetHQ = netProfitHQ === -Infinity ? null : netProfitHQ;
        const safeNetNQ = netProfitNQ === -Infinity ? null : netProfitNQ;

        // Assemble Calculation View Model
        const calculation: LeveCalculation = {
            leve,
            item,
            market,
            marketAnalysis,

            costNQ: profitResult.costNQ,
            revenueNQ: profitResult.revenueNQ,
            profitNQ: profitResult.profitNQ,

            costHQ: profitResult.costHQ,
            revenueHQ: profitResult.revenueHQ,
            profitHQ: profitResult.profitHQ,

            totalXPNQ: xpResult.totalXPNQ,
            totalXPHQ: xpResult.totalXPHQ,
            bonusExpectedValue: bonusEV,
            bonusBreakdown: bonusEVResult,

            netProfitNQ: safeNetNQ,
            netProfitHQ: safeNetHQ,

            optimalQuality: 'HQ',
            optimalProfit: null,
            optimalCost: null,
            optimalXP: xpResult.totalXPHQ,

            freshnessStatus: 'unavailable',
            isStale: false,
            isUnavailable: !market
        };

        if (context.mode === 'profit') {
            const maxProfit = Math.max(profitCraftHQ, profitBuyHQ, profitCraftNQ, profitBuyNQ);

            if (maxProfit === -Infinity) {
                calculation.optimalQuality = 'NQ';
                log(`  - Result: No profitable scenarios found.`);
            } else {
                calculation.optimalProfit = maxProfit;

                if (maxProfit === profitCraftHQ) {
                    calculation.optimalQuality = 'HQ';
                    calculation.optimalCost = costCraft;
                    log(`  - Result: Optimal is CRAFT HQ (Profit: ${maxProfit.toFixed(0)})`);
                } else if (maxProfit === profitBuyHQ) {
                    calculation.optimalQuality = 'HQ';
                    calculation.optimalCost = markCostHQ;
                    log(`  - Result: Optimal is BUY HQ (Profit: ${maxProfit.toFixed(0)})`);
                } else if (maxProfit === profitCraftNQ) {
                    calculation.optimalQuality = 'NQ';
                    calculation.optimalCost = costCraft;
                    log(`  - Result: Optimal is CRAFT NQ (Profit: ${maxProfit.toFixed(0)})`);
                } else {
                    calculation.optimalQuality = 'NQ';
                    calculation.optimalCost = bestBuyNQ;
                    log(`  - Result: Optimal is BUY NQ (Profit: ${maxProfit.toFixed(0)})`);
                }
            }
        } else {
            // Leveling - Prioritize HQ XP, but still calculate profit for display
            calculation.optimalQuality = 'HQ';
            calculation.optimalXP = calculation.totalXPHQ;

            // Find cheapest acquisition for HQ
            let optimalCost = null;
            if (costCraft !== null && markCostHQ !== null) {
                optimalCost = costCraft < markCostHQ ? costCraft : markCostHQ;
            } else if (costCraft !== null) {
                optimalCost = costCraft;
            } else {
                optimalCost = markCostHQ;
            }

            calculation.optimalCost = optimalCost;

            // Calculate profit even in leveling mode (RevenueHQ - CostHQ + BonusEV)
            if (optimalCost !== null) {
                calculation.optimalProfit = calculation.revenueHQ - optimalCost + bonusEV;
            } else {
                calculation.optimalProfit = null;
            }
            log(`  - Result: Leveling mode, optimal cost for HQ XP: ${optimalCost ?? 'N/A'}`);
        }

        // REFINE BREAKDOWN: Re-calculate for HQ if that's the optimal target
        // This ensures the Sidebar shows the correct market prices/worlds for HQ
        if (calculation.optimalQuality === 'HQ') {
            const hqBreakdown = calculateCraftingCost(item.id, leve.requiredQty * leve.turnins, calcContext, 0, true);
            if (hqBreakdown) {
                craftingBreakdown = hqBreakdown;
            }
        }

        // Freshness
        if (market) {
            const ageMs = Date.now() - new Date(market.lastUpdated).getTime();
            const thresholdHours = context.settings?.maxStaleHours || 24;
            if (ageMs > thresholdHours * 3600 * 1000) {
                calculation.freshnessStatus = 'stale';
                calculation.isStale = true;
            } else if (ageMs > (thresholdHours / 6) * 3600 * 1000) {
                calculation.freshnessStatus = 'moderate';
            } else {
                calculation.freshnessStatus = 'fresh';
            }
        }

        // Score
        let score = 0;
        let ratio = 0;

        if (typeof calculation.optimalCost === 'number') {
            const revenue = calculation.optimalQuality === 'HQ' ? calculation.revenueHQ : calculation.revenueNQ;
            const netCost = calculation.optimalCost - revenue;

            if (netCost <= 0) {
                ratio = 100_000_000 + (-netCost);
            } else {
                ratio = calculation.totalXPHQ / netCost;
            }
        }

        if (context.sortBy === 'profit') {
            score = calculation.optimalProfit || -999999999;
        } else if (context.sortBy === 'xp') {
            score = calculation.totalXPHQ;
        } else if (context.sortBy === 'ratio') {
            score = ratio;
        }

        results.push({
            calculation,
            rank: 0,
            score,
            craftingBreakdown,
            calculationLogs: logs,
            jobId: JOB_ID_MAPPING[leve.jobId] as JobId,
            jobIcon: JOBS[JOB_ID_MAPPING[leve.jobId] as JobId]?.iconUrl || ''
        });
    }

    // Sort
    results.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score; // Descending
        }

        if (context.sortBy === 'ratio') {
            const xpA = a.calculation.totalXPHQ;
            const xpB = b.calculation.totalXPHQ;
            if (xpA !== xpB) return xpB - xpA;
        }

        const aTime = a.calculation.market ? new Date(a.calculation.market.lastUpdated).getTime() : 0;
        const bTime = b.calculation.market ? new Date(b.calculation.market.lastUpdated).getTime() : 0;
        return bTime - aTime;
    });

    results.forEach((r, i) => r.rank = i + 1);

    const duration = Date.now() - startTime;
    logger.debug(`[Ranking] Calculation complete. Processed ${results.length} results in ${duration}ms.`);

    return results;
}

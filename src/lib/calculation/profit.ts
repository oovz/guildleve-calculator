import { Leve } from '@/types/leve';
import { MarketListing } from '@/types/item';
import { analyzeMarketData } from '@/lib/services/market-analysis';

export interface ProfitResult {
    costNQ: number | null;
    revenueNQ: number;
    profitNQ: number | null;

    costHQ: number | null;
    revenueHQ: number; // 2x base
    profitHQ: number | null;
}

import { UserPreferences } from '@/types/user-preferences';

export function calculateProfit(
    leve: Leve,
    market: MarketListing | null,
    settings?: UserPreferences,
    priceOverrides?: Record<number, number>
): ProfitResult {

    const quantity = leve.requiredQty * leve.turnins;
    const revenueNQ = leve.rewardGil * leve.turnins;
    const revenueHQ = revenueNQ * 2;

    let costNQ: number | null = null;
    let costHQ: number | null = null;

    const overridePrice = priceOverrides?.[leve.requiredItemId];

    if (overridePrice !== undefined) {
        costNQ = overridePrice * quantity;
        costHQ = overridePrice * quantity;
    } else if (market) {
        const analysisNQ = analyzeMarketData(market, quantity, false, false, settings);
        const analysisHQ = analyzeMarketData(market, quantity, true, false, settings);

        if (!analysisNQ.isUntrustworthy) {
            costNQ = analysisNQ.recommendedPrice * quantity;
        }
        if (!analysisHQ.isUntrustworthy) {
            costHQ = analysisHQ.recommendedPrice * quantity;
        }
    }

    return {
        costNQ,
        revenueNQ,
        profitNQ: costNQ !== null ? revenueNQ - costNQ : null,
        costHQ,
        revenueHQ,
        profitHQ: costHQ !== null ? revenueHQ - costHQ : null
    };
}


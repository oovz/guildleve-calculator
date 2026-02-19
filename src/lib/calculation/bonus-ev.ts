import { UserPreferences } from '@/types/user-preferences';
import { analyzeMarketData } from '@/lib/services/market-analysis';
import { Item, MarketListing } from '@/types/item';
import { BonusRewardGroup, LocalizedString } from '@/types/leve';
import { BonusExpectedValue, BonusItemBreakdown } from '@/types/calculation';

export function calculateBonusEV(
    groups: BonusRewardGroup[],
    bonusItemMarketData: Record<number, MarketListing | null>,
    turnins: number,
    itemsMap: Record<string | number, Item>,
    settings?: UserPreferences
): BonusExpectedValue {


    let totalEV = 0;
    const breakdown: BonusItemBreakdown[] = [];

    for (const group of groups) {
        if (!group.items || group.items.length === 0) continue;

        const itemProb = group.probability / (group.items.length || 1);

        for (const rewardItem of group.items) {
            const market = bonusItemMarketData[rewardItem.itemId];
            const itemDef = itemsMap[rewardItem.itemId];

            const analysis = analyzeMarketData(market, rewardItem.count, rewardItem.isHq, true, settings);

            // If Untrustworthy, use NPC Vendor Sell Price
            let unitPrice = 0;

            if (analysis.isUntrustworthy) {
                unitPrice = itemDef?.vendorSellPrice || 0;
            } else {
                unitPrice = analysis.recommendedPrice;
            }


            const totalValue = unitPrice * rewardItem.count;

            const itemName: LocalizedString = itemDef ? itemDef.name : { en: `Item #${rewardItem.itemId}`, 'zh-Hans': `Item #${rewardItem.itemId}` };
            const iconUrl = itemDef?.iconUrl;

            breakdown.push({
                itemId: rewardItem.itemId,
                itemName,
                iconUrl,
                probability: itemProb,
                count: rewardItem.count,
                isHq: rewardItem.isHq,
                marketPrice: unitPrice,
                expectedValue: totalValue * itemProb
            });

            totalEV += (totalValue * itemProb);
        }
    }

    const perTurninValue = totalEV;

    return {
        perTurninValue,
        totalExpectedValue: perTurninValue * turnins,
        breakdown
    };
}

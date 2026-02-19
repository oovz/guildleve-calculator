
import { calculateBonusEV } from '@/lib/calculation/bonus-ev';
import { BonusRewardGroup } from '@/types/leve';
import { MarketListing } from '@/types/item';
import { describe, it, expect } from 'vitest';

describe('calculateBonusEV', () => {
    it('should use minPriceNQ instead of averagePriceNQ for calculation', () => {
        const groups: BonusRewardGroup[] = [{
            probability: 1.0,
            items: [{ itemId: 123, count: 1, isHq: false }]
        }];

        const marketData: Record<number, MarketListing> = {
            123: {
                itemId: 123,
                minPriceNQ: 100,
                minPriceNQTax: 0,
                averagePriceNQ: 999999, // Outlier
                datacenter: 'Test',
                lastUpdated: new Date().toISOString(),
                worldNQ: null,
                minPriceHQ: 0,
                averagePriceHQ: 0,
                worldHQ: null,
                listingsCount: 10,
                regularSaleVelocity: 1,
                unitsForSale: 10
            }
        };

        const itemsMap = { 123: { name: { en: 'Test Item' } } };

        const result = calculateBonusEV(groups, marketData, 1, itemsMap as any);

        // Expected: 1.0 probability * 1 count * 100 base price * (1 - 0.05 tax) = 95
        expect(result.perTurninValue).toBe(95);
        expect(result.perTurninValue).not.toBe(999999);
    });

    it('should fallback to 0 if no market data', () => {
        const groups: BonusRewardGroup[] = [{
            probability: 1.0,
            items: [{ itemId: 999, count: 1, isHq: false }]
        }];

        const marketData: Record<number, MarketListing> = {};
        const itemsMap = { 999: { name: { en: 'Test Item 2' } } };

        const result = calculateBonusEV(groups, marketData, 1, itemsMap as any);

        expect(result.perTurninValue).toBe(0);
    });
});

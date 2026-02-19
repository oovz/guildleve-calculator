import { describe, it, expect } from 'vitest';
import { analyzeMarketData } from '@/lib/services/market-analysis';
import { MarketListing } from '@/types/item';

describe('Market Analysis Service', () => {
    it('returns score 0 and warning if no listing', () => {
        const result = analyzeMarketData(null, 3);
        expect(result.reliabilityScore).toBe(0);
        expect(result.warnings).toContain('No market data available');
    });

    it('identifies fresh data with good supply', () => {
        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 100,
            averagePriceNQ: 100,
            worldNQ: 'TestWorld',
            minPriceHQ: 200,
            averagePriceHQ: 200,
            worldHQ: 'TestWorld',
            lastUpdated: new Date().toISOString(), // Fresh
            listingsCount: 10,
            regularSaleVelocity: 10,
            unitsForSale: 100 // Plenty (Need 3)
        };

        const result = analyzeMarketData(listing, 3);
        expect(result.reliabilityScore).toBe(100);
        expect(result.isStale).toBe(false);
        expect(result.isOutlier).toBe(false);
        expect(result.isLowSupply).toBe(false);
        expect(result.warnings.length).toBe(0);
    });

    it('penalizes stale data', () => {
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 25); // 25h old

        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 100,
            averagePriceNQ: 100,
            worldNQ: 'TestWorld',
            minPriceHQ: 0,
            averagePriceHQ: 0,
            worldHQ: null,
            lastUpdated: yesterday.toISOString(),
            listingsCount: 5,
            regularSaleVelocity: 5,
            unitsForSale: 100
        };

        const result = analyzeMarketData(listing, 3);
        expect(result.isStale).toBe(true);
        expect(result.reliabilityScore).toBeLessThan(100);
        expect(result.warnings.some(w => w.includes('hours old'))).toBe(true);
    });

    it('penalizes low supply (less than 3 turn-ins available)', () => {
        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 100,
            averagePriceNQ: 100,
            worldNQ: 'TestWorld',
            minPriceHQ: null,
            averagePriceHQ: null,
            worldHQ: null,
            lastUpdated: new Date().toISOString(),
            listingsCount: 10, // Increased to avoid Untrustworthy flag
            regularSaleVelocity: 5,
            unitsForSale: 5 // Need 3. 5 < 3*3 (9). So Low Supply.
        };

        const result = analyzeMarketData(listing, 3);
        expect(result.isLowSupply).toBe(true);
        expect(result.reliabilityScore).toBeLessThan(100);
        // Note: Low supply without critical shortage doesn't add a specific warning in current implementation
    });

    it('critically penalizes supply shortage (less than 1 related turn-in)', () => {
        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 100,
            averagePriceNQ: 100,
            worldNQ: 'TestWorld',
            minPriceHQ: null,
            averagePriceHQ: null,
            worldHQ: null,
            lastUpdated: new Date().toISOString(),
            listingsCount: 10, // Increased to avoid Untrustworthy flag
            regularSaleVelocity: 5,
            unitsForSale: 2 // Need 3. 2 < 3. Critical.
        };

        const result = analyzeMarketData(listing, 3);
        expect(result.isLowSupply).toBe(true); // Should flag as low supply (generic flag)
        expect(result.reliabilityScore).toBe(60); // 100 - 40 = 60
        expect(result.warnings.some(w => w.includes('Critical Shortage'))).toBe(true);
    });

    it('penalizes price outliers (suspiciously cheap min)', () => {
        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 10,     // 10
            medianPriceNQ: 100, // History median
            averagePriceNQ: 100, // Average 100. 10 < 50 (100 * 0.5 threshold). Outlier.
            worldNQ: 'TestWorld',
            minPriceHQ: null,
            averagePriceHQ: null,
            worldHQ: null,
            lastUpdated: new Date().toISOString(),
            listingsCount: 5,
            regularSaleVelocity: 5,
            unitsForSale: 100
        };

        const result = analyzeMarketData(listing, 3);
        expect(result.isOutlier).toBe(true);
        expect(result.reliabilityScore).toBeLessThan(100);
    });

    it('marks data as untrustworthy for buyers if no active listings but history exists', () => {
        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 0, // No active listings
            worldNQ: 'Test',
            minPriceHQ: 0,
            averagePriceHQ: 0,
            worldHQ: null,
            medianPriceNQ: 500, // History exists
            averagePriceNQ: 500,
            lastUpdated: new Date().toISOString(),
            listingsCount: 10,
            regularSaleVelocity: 5,
            unitsForSale: 100
        };

        const result = analyzeMarketData(listing, 3, false, false); // Buying
        expect(result.isUntrustworthy).toBe(true);
        expect(result.warnings).toContain('No usable price data found for the requested quality');
        expect(result.recommendedPrice).toBe(0); // Should be 0 since minPrice is 0
    });

    it('Edge profile ignores outlier defense', () => {
        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 10,
            averagePriceNQ: 100,
            medianPriceNQ: 100,
            worldNQ: 'Test',
            minPriceHQ: null,
            averagePriceHQ: null,
            worldHQ: null,
            lastUpdated: new Date().toISOString(),
            listingsCount: 1,
            regularSaleVelocity: 1,
            unitsForSale: 100
        };

        // Standard logic would mark this as outlier and score < 100
        const result = analyzeMarketData(listing, 1, false, false, {
            mode: 'profit',
            jobLevels: {},
            levelingJobId: null,
            datacenter: 'Test',
            setupCompleted: true,
            selectedJobProfit: [],
            selectedJobLeveling: null,
            language: 'en',
            theme: 'light',
            marketProfile: 'edge'
        });

        expect(result.isOutlier).toBe(false); // Edge doesn't check outliers
        expect(result.reliabilityScore).toBe(100);
    });

    it('Strict profile is more sensitive to stale data', () => {
        const sixHoursAgo = new Date();
        sixHoursAgo.setHours(sixHoursAgo.getHours() - 13); // 13h old. Strict threshold is 12h.

        const listing: MarketListing = {
            itemId: 1,
            datacenter: 'TestDC',
            minPriceNQ: 100,
            averagePriceNQ: 100,
            worldNQ: 'TestWorld',
            minPriceHQ: 0,
            averagePriceHQ: 0,
            worldHQ: null,
            lastUpdated: sixHoursAgo.toISOString(),
            listingsCount: 10,
            regularSaleVelocity: 10,
            unitsForSale: 100
        };

        const result = analyzeMarketData(listing, 1, false, false, {
            mode: 'profit',
            jobLevels: {},
            levelingJobId: null,
            datacenter: 'Test',
            setupCompleted: true,
            selectedJobProfit: [],
            selectedJobLeveling: null,
            language: 'en',
            theme: 'light',
            marketProfile: 'strict'
        });

        expect(result.isStale).toBe(true); // 13h > 12h
    });
});

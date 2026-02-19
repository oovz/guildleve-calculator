import { describe, it, expect } from 'vitest';
import { rankLeves, RankingContext } from '../../src/lib/services/ranking';
import { Leve } from '../../src/types/leve';
import { Item, MarketListing } from '../../src/types/item';
import { Recipe } from '../../src/types/recipe';

/**
 * Tests for Ratio calculation (XP per Gil cost)
 * 
 * Bug Report: Leve "制作委托：异国风格的木制耳饰" shows:
 * - Ratio: 0.79
 * - XP: 790,860
 * - Profit: 7,166
 * 
 * Expected: Ratio should be XP / NetCost where NetCost = Cost - Revenue
 * If profitable (NetCost <= 0), ratio should be Infinite (displayed as ∞)
 * 
 * The bug was that the display was showing raw decimal ratios that didn't
 * match the intuitive understanding of "XP per Gil spent"
 */

// Test Leve based on real data: "The Ear Is the Way to the Heart" (ID: 1248)
const mockLeveReal: Leve = {
    id: 1248,
    name: {
        en: 'The Ear Is the Way to the Heart',
        'zh-Hans': '制作委托：异国风格的木制耳饰'
    },
    level: 66,
    jobId: 9, // CRP
    requiredItemId: 19738, // Persimmon Earrings
    requiredQty: 1,
    turnins: 1,
    rewardGil: 2434,
    rewardExp: 395430, // HQ XP = 790,860
    npcId: 0,
    bonusRewards: []
};

// Mock Item: Persimmon Earrings (柿木耳坠)
const mockItemPersimmon: Item = {
    id: 19738,
    name: { en: 'Persimmon Earrings', 'zh-Hans': '柿木耳坠' },
    iconId: '055404',
    ilvl: 245,
    canBeHq: true,
    npcPrice: 14553 // Has NPC vendor price
};

// Mock ingredient items
const mockLog: Item = {
    id: 19937, // Persimmon Log
    name: { en: 'Persimmon Log', 'zh-Hans': '柿木原木' },
    iconId: '022659',
    ilvl: 1,
    canBeHq: false,
    npcPrice: null
};

const mockRecipePersimmon: Recipe = {
    id: 32156,
    itemId: 19738,
    yield: 1,
    jobId: 9, // CRP
    level: 66,
    canHq: true,
    ingredients: [
        { itemId: 19937, amount: 2 } // 2 Persimmon Logs
    ]
};

describe('Ratio Calculation', () => {

    it('calculates ratio correctly when profitable (NetCost <= 0)', () => {
        // When NetCost is 0 or negative, the leve is profitable
        // Ratio should be a very large number (100M + profit) for sorting

        const context: RankingContext = {
            mode: 'profit',
            sortBy: 'ratio',
            leves: [mockLeveReal],
            marketData: {
                // Market price much lower than NPC - good deal!
                19738: {
                    itemId: 19738,
                    minPriceNQ: 500,  // Very cheap on market
                    minPriceHQ: 1000,
                    averagePriceNQ: 800,
                    averagePriceHQ: 1500,
                    worldNQ: 'Tonberry',
                    worldHQ: 'Tonberry',
                    lastUpdated: new Date().toISOString(),
                    datacenter: 'Elemental',
                    listingsCount: 10,
                    regularSaleVelocity: 5,
                    unitsForSale: 20
                } as MarketListing
            },
            items: {
                '19738': mockItemPersimmon
            },
            recipes: {},  // Not craftable for this test
            jobLevels: { CRP: 100, BSM: 100, ARM: 100, GSM: 100, LTW: 100, WVR: 100, ALC: 100, CUL: 100 },
            selectedJobs: ['CRP']
        };

        const results = rankLeves(context);
        expect(results.length).toBe(1);

        const result = results[0];
        // Revenue HQ = 2434 * 2 = 4868
        // Cost HQ = 1000
        // Net Cost = 1000 - 4868 = -3868 (Profitable!)
        // Ratio should be > 100M (infinite efficiency score)
        expect(result.score).toBeGreaterThan(100_000_000);
    });

    it('calculates ratio correctly when not profitable (NetCost > 0)', () => {
        // When buying from market costs more than revenue

        const context: RankingContext = {
            mode: 'profit',
            sortBy: 'ratio',
            leves: [mockLeveReal],
            marketData: {
                19738: {
                    itemId: 19738,
                    minPriceNQ: 50000, // Very expensive
                    minPriceHQ: 100000,
                    averagePriceNQ: 60000,
                    averagePriceHQ: 120000,
                    worldNQ: 'Tonberry',
                    worldHQ: 'Tonberry',
                    lastUpdated: new Date().toISOString(),
                    datacenter: 'Elemental',
                    listingsCount: 2,
                    regularSaleVelocity: 0.1,
                    unitsForSale: 5
                } as MarketListing
            },
            items: {
                '19738': mockItemPersimmon
            },
            recipes: {},
            jobLevels: { CRP: 100, BSM: 100, ARM: 100, GSM: 100, LTW: 100, WVR: 100, ALC: 100, CUL: 100 },
            selectedJobs: ['CRP']
        };

        const results = rankLeves(context);
        expect(results.length).toBe(1);

        const result = results[0];
        // NPC Price is cheaper: 14553
        // Revenue HQ = 4868
        // Net Cost = 14553 - 4868 = 9685
        // Ratio = 790860 / 9685 ≈ 81.66
        expect(result.score).toBeGreaterThan(50);
        expect(result.score).toBeLessThan(100);
    });

    it('prefers NPC vendor price over expensive market price', () => {
        const context: RankingContext = {
            mode: 'profit',
            sortBy: 'ratio',
            leves: [mockLeveReal],
            marketData: {
                19738: {
                    itemId: 19738,
                    minPriceNQ: 50000, // Market very expensive
                    minPriceHQ: null,  // No HQ on market
                    averagePriceNQ: 60000,
                    averagePriceHQ: null,
                    worldNQ: 'Tonberry',
                    worldHQ: null,
                    lastUpdated: new Date().toISOString(),
                    datacenter: 'Elemental',
                    listingsCount: 1,
                    regularSaleVelocity: 0.01,
                    unitsForSale: 1
                } as MarketListing
            },
            items: {
                '19738': mockItemPersimmon // Has npcPrice: 14553
            },
            recipes: {},
            jobLevels: { CRP: 100, BSM: 100, ARM: 100, GSM: 100, LTW: 100, WVR: 100, ALC: 100, CUL: 100 },
            selectedJobs: ['CRP']
        };

        const results = rankLeves(context);
        const result = results[0];

        // Should use NPC price (14553) not market price (50000)
        // For NQ path: NPC cost is 14553, revenue is 2434
        // bestBuyNQ should be min(50000, 14553) = 14553
        expect(result.calculation.netProfitNQ).not.toBeNull();

        // Revenue NQ = 2434
        // Best NQ cost = NPC = 14553
        // Net Profit NQ = 2434 - 14553 + bonusEV = negative (loss)
        expect(result.calculation.netProfitNQ).toBeLessThan(0);
    });

    it('handles case when no market data and no NPC price', () => {
        const itemNoVendor = { ...mockItemPersimmon, npcPrice: null };

        const context: RankingContext = {
            mode: 'profit',
            sortBy: 'ratio',
            leves: [mockLeveReal],
            marketData: {},  // No market data
            items: {
                '19738': itemNoVendor
            },
            recipes: {},
            jobLevels: { CRP: 100, BSM: 100, ARM: 100, GSM: 100, LTW: 100, WVR: 100, ALC: 100, CUL: 100 },
            selectedJobs: ['CRP']
        };

        const results = rankLeves(context);
        expect(results.length).toBe(1);

        // Without any cost data, ratio calculation should handle gracefully
        const result = results[0];
        expect(result.calculation.optimalCost).toBeNull();
    });

});

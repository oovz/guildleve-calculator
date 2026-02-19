import { describe, it, expect } from 'vitest';
import { rankLeves, RankingMode } from '../../src/lib/services/ranking';
import { Leve } from '../../src/types/leve';
import { Item, MarketListing } from '../../src/types/item';
import { Recipe } from '../../src/types/recipe';
import { RankingContext } from '../../src/lib/services/ranking';

// Mocks
const mockLeve: Leve = {
    id: 1,
    name: { en: 'Test Leve', 'zh-Hans': 'CN' },
    level: 10,
    jobId: 9, // CRP
    requiredItemId: 101,
    requiredQty: 3,
    turnins: 3,
    rewardGil: 100, // Total Revenue = 100 * 3 = 300
    rewardExp: 1000,
    bonusRewards: [],
    npcId: 999
};

const mockItem: Item = {
    id: 101,
    name: { en: 'Final Item', 'zh-Hans': 'F' },
    iconId: '123',
    ilvl: 0,
    canBeHq: true,
    npcPrice: null
};

// Ingredient: Log
const mockLog: Item = {
    id: 201,
    name: { en: 'Log', 'zh-Hans': 'L' },
    iconId: '456',
    ilvl: 0,
    canBeHq: false,
    npcPrice: 5 // Vendor price 5
};

const mockRecipe: Recipe = {
    id: 1001,
    itemId: 101, // Result Item ID
    yield: 1,
    jobId: 9, // CRP
    level: 10,
    canHq: true,
    ingredients: [
        { itemId: 201, amount: 1 } // 1 Log makes 1 Final Item
    ]
};

const mockContextBase: RankingContext = {
    mode: 'profit',
    leves: [mockLeve],
    marketData: {},
    items: {
        '101': mockItem,
        '201': mockLog
    },
    recipes: {
        '101': mockRecipe
    },
    jobLevels: {
        CRP: 90,
        BSM: 90,
        ARM: 90,
        GSM: 90,
        LTW: 90,
        WVR: 90,
        ALC: 90,
        CUL: 90
    },
    selectedJobs: ['CRP']
};

describe('rankLeves', () => {

    it('recommends Crafting when Market is expensive', () => {
        // Market is expensive: 100 gil per item
        // Craft cost: 1 Log (5 gil NPC) = 5 gil per item
        // Total Qty needed: 3 * 3 = 9
        // Market Cost: 100 * 9 = 900
        // Craft Cost: 5 * 9 = 45
        // Revenue: 300

        const context = {
            ...mockContextBase,
            marketData: {
                // Main Item Market
                101: {
                    itemId: 101,
                    minPriceNQ: 100, // Expensive
                    minPriceHQ: 200,
                    worldNQ: 'W1',
                    worldHQ: 'W1',
                    lastUpdated: new Date().toISOString(),
                    datacenter: 'TestDC',
                    listingsCount: 5
                } as MarketListing,
                // Ingredient Market (Optional, since NPC is cheaper)
                201: {
                    itemId: 201,
                    minPriceNQ: 50, // Expensive on market too
                    minPriceHQ: null,
                    worldNQ: 'W1',
                    worldHQ: null,
                    lastUpdated: new Date().toISOString(),
                    datacenter: 'TestDC',
                    listingsCount: 5
                } as MarketListing
            }
        };

        const results = rankLeves(context);
        const result = results[0];

        // Should prefer craft
        expect(result.craftingBreakdown!.optimalMethod).toBe('craft');

        // Optimal Cost should be Craft Cost (45)
        expect(result.calculation.optimalCost).toBe(45);

        // Net Profit NQ = Revenue (300) - Craft Cost (45) = 255
        expect(result.calculation.netProfitNQ).toBe(255);
    });

    it('recommends Market when Crafting is expensive', () => {
        // Market Cheap: 10 gil
        // Craft Ingredient: 50 gil (NPC price upped or removed)

        const expensiveLog = { ...mockLog, npcPrice: null }; // No vendor

        const context = {
            ...mockContextBase,
            items: { '101': mockItem, '201': expensiveLog },
            marketData: {
                101: {
                    itemId: 101,
                    minPriceNQ: 10, // Cheap
                    minPriceNQTax: 0,
                    minPriceHQ: 200,
                    minPriceHQTax: 0,
                    worldNQ: 'W1',
                    worldHQ: 'W1',
                    lastUpdated: new Date().toISOString(),
                    datacenter: 'TestDC',
                    listingsCount: 5
                } as MarketListing,
                201: {
                    itemId: 201,
                    minPriceNQ: 50, // Ingredient Expensive
                    minPriceHQ: null,
                    worldNQ: 'W1',
                    worldHQ: null,
                    lastUpdated: new Date().toISOString(),
                    datacenter: 'TestDC',
                    listingsCount: 5
                } as MarketListing
            }
        };

        const results = rankLeves(context);
        const result = results[0];

        expect(result.craftingBreakdown!.optimalMethod).toBe('buy');
        expect(result.calculation.optimalCost).toBe(90); // 10 * 9
        expect(result.calculation.netProfitNQ).toBe(210); // 300 - 90
    });

    it('filters out unselected jobs', () => {
        const context = {
            ...mockContextBase,
            selectedJobs: ['BSM'] // Only BSM selected
        };
        // mockLeve is CRP
        const results = rankLeves(context);
        expect(results.length).toBe(0);
    });

    it('filters leves by specific job level in Leveling Mode', () => {
        const context: RankingContext = {
            ...mockContextBase,
            mode: 'leveling',
            // CRP is Level 5, Leve is Level 10
            jobLevels: { ...mockContextBase.jobLevels, CRP: 5 },
            leves: [mockLeve] // Leve requires Level 10
        };

        const results = rankLeves(context);
        expect(results.length).toBe(0);

        // If we raise level to 10, it should appear
        const contextSuccess = {
            ...context,
            jobLevels: { ...mockContextBase.jobLevels, CRP: 10 }
        };
        const resultsSuccess = rankLeves(contextSuccess);
        expect(resultsSuccess.length).toBe(1);
    });

    it('tie-breaks using freshness', () => {
        // Create 2 identical results with different timestamps

        const leve1 = { ...mockLeve, id: 1 };
        const leve2 = { ...mockLeve, id: 2 };

        const now = Date.now();
        const oldTime = new Date(now - 100000).toISOString();
        const newTime = new Date(now).toISOString();

        // Need separate items to map to different market data timestamps?
        // Or same item, different results? 
        // rankLeves iterates Leves. 
        // If they use SAME item, they get SAME market data.
        // Let's make them use distinct items.

        const item1 = { ...mockItem, id: 101 };
        const item2 = { ...mockItem, id: 102 }; // Item for Leve 2

        const context: RankingContext = {
            ...mockContextBase,
            leves: [{ ...leve1, requiredItemId: 101 }, { ...leve2, requiredItemId: 102 }],
            items: {
                '101': item1,
                '102': item2,
                '201': mockLog
            },
            marketData: {
                // Item 1: Old Data
                101: {
                    itemId: 101,
                    minPriceNQ: 10,
                    minPriceHQ: 10,
                    worldNQ: 'W1',
                    worldHQ: 'W1',
                    lastUpdated: oldTime,
                    datacenter: 'TestDC',
                    listingsCount: 5
                } as MarketListing,
                // Item 2: New Data
                102: {
                    itemId: 102,
                    minPriceNQ: 10,
                    minPriceHQ: 10,
                    worldNQ: 'W1',
                    worldHQ: 'W1',
                    lastUpdated: newTime, // Fresher
                    datacenter: 'TestDC',
                    listingsCount: 5
                } as MarketListing,
                201: null
            },
            recipes: {
                '101': mockRecipe,
                '102': { ...mockRecipe, id: 1002, itemId: 102, level: 10 }
            }
        };

        const results = rankLeves(context);
        expect(results.length).toBe(2);

        // Profits are identical. Expect fresher (Item 2 / Leve 2) first.
        expect(results[0].calculation.leve.id).toBe(2);
        expect(results[1].calculation.leve.id).toBe(1);
    });

});

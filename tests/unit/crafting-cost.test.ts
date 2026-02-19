
import { describe, it, expect, vi } from 'vitest';
import { calculateCraftingCost, CalculatorContext } from '@/lib/calculation/crafting-cost';
import { Recipe } from '@/types/recipe';
import { Item, MarketListing } from '@/types/item';

vi.mock('@/lib/services/market-analysis', () => ({
    analyzeMarketData: vi.fn((data, qty, isHq) => {
        if (!data) return { isUntrustworthy: true };
        return {
            isUntrustworthy: false,
            recommendedPrice: isHq ? data.minPriceHQ : data.minPriceNQ,
        };
    }),
}));

describe('Crafting Cost Calculation', () => {
    const mockItem: Item = {
        id: 1,
        name: { en: 'Final Item', 'zh-Hans': '最终物品' },
        iconUrl: '/icon1.png',
        ilvl: 1,
        npcPrice: 1000,
        canBeHq: true,
    };

    const mockIngredient: Item = {
        id: 2,
        name: { en: 'Ingredient', 'zh-Hans': '材料' },
        iconUrl: '/icon2.png',
        ilvl: 1,
        npcPrice: 100,
        canBeHq: false,
    };

    const mockRecipe: Recipe = {
        id: 101,
        itemId: 1,
        yield: 1,
        jobId: 9,
        level: 1,
        canHq: true,
        ingredients: [
            { itemId: 2, amount: 2 }
        ]
    };

    const mockMarket: Record<string, MarketListing> = {
        '1': {
            itemId: 1,
            minPriceNQ: 800,
            minPriceHQ: 1500,
            datacenter: 'Test',
            lastUpdated: new Date().toISOString(),
            worldNQ: 'WorldA',
            worldHQ: 'WorldB'
        } as any,
        '2': {
            itemId: 2,
            minPriceNQ: 50,
            datacenter: 'Test',
            lastUpdated: new Date().toISOString(),
            worldNQ: 'WorldA'
        } as any,
    };

    const context: CalculatorContext = {
        items: { '1': mockItem, '2': mockIngredient },
        recipes: { '1': mockRecipe },
        market: mockMarket,
        settings: { marketProfile: 'standard' } as any
    };

    it('chooses the cheapest option (market vs npc vs craft)', () => {
        // Market 1: 800
        // NPC 1: 1000
        // Craft 1: 2 * (min(Market 2: 50, NPC 2: 100)) = 2 * 50 = 100
        // Optimal should be Craft (100)

        const result = calculateCraftingCost(1, 1, context);
        expect(result?.optimalCost).toBe(100);
        expect(result?.optimalMethod).toBe('craft');
    });

    it('respects NPC price when it is cheaper than market', () => {
        const customContext: CalculatorContext = {
            ...context,
            market: {
                ...mockMarket,
                '1': { ...mockMarket['1'], minPriceNQ: 2000 } as any,
                '2': { ...mockMarket['2'], minPriceNQ: 2000 } as any, // Crafting also expensive
            }
        };

        // Market 1: 2000
        // NPC 1: 1000
        // Craft 1: 2 * 100 (NPC 2) = 200
        // wait, Craft is still cheaper (200). 
        // Let's make NPC 2 very expensive too.

        const expensiveContext: CalculatorContext = {
            ...customContext,
            items: {
                ...context.items,
                '2': { ...mockIngredient, npcPrice: 2000 }
            }
        };

        // Market 1: 2000
        // NPC 1: 1000
        // Craft 1: 2 * 2000 = 4000
        // Optimal should be NPC 1 (1000)

        const result = calculateCraftingCost(1, 1, expensiveContext);
        expect(result?.optimalCost).toBe(1000);
        expect(result?.optimalMethod).toBe('buy');
        expect(result?.buySource).toBe('npc');
    });

    it('handles yields > 1 correctly', () => {
        const recipeYield2: Recipe = { ...mockRecipe, yield: 2 };
        const yieldContext: CalculatorContext = {
            ...context,
            recipes: { '1': recipeYield2 }
        };

        // Need 1 item. Recipe yields 2. Requires 1 craft.
        // Cost: 2 * 50 = 100.
        // Resulting optimalCost for 1 item should be 100 (since we must craft at least once)
        // Wait, the logic is: craftsNeeded = ceil(quantity / yield) = ceil(1/2) = 1.
        // craftingCost = craftsNeeded * recipeCostPerCraft = 1 * 100 = 100.

        const result = calculateCraftingCost(1, 1, yieldContext);
        expect(result?.optimalCost).toBe(100);
    });

    it('handles multiple crafts for higher quantity', () => {
        const recipeYield2: Recipe = { ...mockRecipe, yield: 2 };
        const yieldContext: CalculatorContext = {
            ...context,
            recipes: { '1': recipeYield2 }
        };

        // Need 3 items. Recipe yields 2. Requires 2 crafts.
        // Cost: 2 crafts * 100/craft = 200.

        const result = calculateCraftingCost(1, 3, yieldContext);
        expect(result?.optimalCost).toBe(200);
        expect(result?.quantity).toBe(3);
    });

    it('respects source preference: npc', () => {
        const npcPrefContext: CalculatorContext = {
            ...context,
            sourcePreference: 'npc'
        };

        // Market 1: 800
        // NPC 1: 1000
        // Craft 1: 100
        // Even if craft is 100, if sourcePreference is npc, it might prefer NPC?
        // Looking at code:
        // if (pref === 'npc') {
        //   selected = valid.find(v => v.source === 'buy' && v.subSource === 'npc')
        //     || valid.find(v => v.source === 'craft')
        //     || ...
        // }
        // So it prefers NPC Buy > Craft > others.

        const result = calculateCraftingCost(1, 1, npcPrefContext);
        expect(result?.optimalCost).toBe(1000);
        expect(result?.buySource).toBe('npc');
    });

    it('handles overrides', () => {
        const overrideContext: CalculatorContext = {
            ...context,
            overrides: { 1: 42 }
        };

        // Override says 1 item costs 42.
        const result = calculateCraftingCost(1, 1, overrideContext);
        expect(result?.optimalCost).toBe(42);
        expect(result?.buySource).toBe('market'); // Overrides are treated as market in code
    });
});

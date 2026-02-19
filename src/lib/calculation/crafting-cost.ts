import { Recipe } from '@/types/recipe';
import { Item, MarketListing } from '@/types/item';
import { CraftingCostBreakdown, IngredientCostDetail } from '@/types/calculation';
import { LocalizedString } from '@/types/leve';
import { analyzeMarketData } from '@/lib/services/market-analysis';
import { UserPreferences } from '@/types/user-preferences';

// Required context for calculation
export interface CalculatorContext {
    recipes: Record<string, Recipe>;
    items: Record<string, Item>;
    market: Record<string, MarketListing | null>;
    overrides?: Record<number, number>;
    currencyRates?: {
        seals: number;
        scrips: number;
        gemstones: number;
    };
    sourcePreference?: 'optimal' | 'npc' | 'market';
    settings?: UserPreferences;
}


const MAX_DEPTH = 4;

export function calculateCraftingCost(
    itemId: number,
    quantity: number,
    context: CalculatorContext,
    depth = 0,
    isHq = false
): CraftingCostBreakdown | null {
    const item = context.items[itemId];
    const recipe = context.recipes[itemId];

    if (!recipe && !item) {
        return null;
    }

    const itemName: LocalizedString = item?.name || { en: `Item #${itemId}`, 'zh-Hans': `Item #${itemId}` };

    // 1. Direct Purchase (Market or Override)
    const marketData = context.market[itemId];
    let marketPrice: number | null = null;
    let directPurchaseWorld = null;

    if (marketData) {
        // Trustworthiness check
        const analysis = analyzeMarketData(marketData, quantity, isHq, false, context.settings);

        if (!analysis.isUntrustworthy) {
            marketPrice = analysis.recommendedPrice;
            // Best world: pick the one corresponding to the quality
            directPurchaseWorld = isHq ? marketData.worldHQ : marketData.worldNQ;
            // Fallback if the specific world is null
            if (!directPurchaseWorld) directPurchaseWorld = marketData.worldNQ || marketData.worldHQ;
        }
    }

    // Apply Override
    const override = context.overrides?.[itemId];
    if (override !== undefined) {
        marketPrice = override;
        directPurchaseWorld = 'Manual';
    }

    // Cost to buy from Market
    const marketPurchaseCost = marketPrice !== null ? marketPrice * quantity : null;

    // 2. Vendor Purchase
    let npcPrice = item?.npcPrice || null;
    if (npcPrice === 0) npcPrice = null;
    const npcCost = npcPrice !== null ? npcPrice * quantity : null;

    // 3. Currency Purchase
    let exchangeCost: number | null = null;
    if (item?.sealCost && context.currencyRates?.seals) {
        exchangeCost = item.sealCost * context.currencyRates.seals * quantity;
    } else if (item?.scripCost && context.currencyRates?.scrips) {
        exchangeCost = item.scripCost * context.currencyRates.scrips * quantity;
    } else if (item?.gemstoneCost && context.currencyRates?.gemstones) {
        exchangeCost = item.gemstoneCost * context.currencyRates.gemstones * quantity;
    }

    // Direct Purchase Cost is usually defined as "Buying the item directly" (Market OR Vendor OR Exchange)
    // We want to represent the "Buy" option in the breakdown.
    // Let's make directPurchaseCost the absolute lowest "Buy" cost.

    let directPurchaseCost = marketPurchaseCost;
    if (npcCost !== null) {
        if (directPurchaseCost === null || npcCost < directPurchaseCost) {
            directPurchaseCost = npcCost;
        }
    }
    if (exchangeCost !== null) {
        if (directPurchaseCost === null || exchangeCost < directPurchaseCost) {
            directPurchaseCost = exchangeCost;
        }
    }

    // 4. Crafting
    let craftingCost: number | null = null;
    let ingredients: IngredientCostDetail[] = [];

    // Only craft if recipe exists and depth < max
    if (recipe && depth < MAX_DEPTH) {
        const yieldAmt = recipe.yield;

        let recipeCostPerCraft = 0;
        let possible = true;
        const subDetails: IngredientCostDetail[] = [];

        for (const ing of recipe.ingredients) {
            const neededPerCraft = ing.amount;
            const result = calculateIngredientCost(ing.itemId, neededPerCraft, context, depth + 1);
            if (result.optimalCost === null) {
                possible = false;
                break;
            }
            recipeCostPerCraft += result.optimalCost;
            subDetails.push(result);
        }

        if (possible) {
            // Unit Cost = RecipeCost / Yield
            // Total cost = (Quantity / Yield) * RecipeCost
            const craftsNeeded = Math.ceil(quantity / yieldAmt);
            craftingCost = craftsNeeded * recipeCostPerCraft;

            ingredients = subDetails.map(d => ({
                ...d,
                quantity: d.quantity * craftsNeeded, // Scale up
                // Fix: optimalCost in subDetails is for "neededPerCraft".
                // We need to scale it to "craftsNeeded" times that.
                optimalCost: (d.optimalCost || 0) * craftsNeeded
            }));
        }
    }

    // 4. Optimal Selection
    let optimalMethod: 'buy' | 'craft' = 'buy';
    let buySource: 'market' | 'npc' | 'exchange' | null = null;
    let optimalCost: number | null = null;

    // Respect Overrides - If an override is present, it forces the cost and selection to that value
    const selectionOverride = context.overrides?.[itemId];
    if (selectionOverride !== undefined) {
        optimalCost = selectionOverride * quantity;
        optimalMethod = 'buy';
        buySource = 'market'; // Overrides are treated as 'Manual' market source
    } else {
        const candidates: { source: 'buy' | 'craft', subSource: 'market' | 'npc' | 'exchange', cost: number | null }[] = [
            { source: 'buy', subSource: 'market', cost: marketPurchaseCost },
            { source: 'buy', subSource: 'npc', cost: npcCost },
            { source: 'buy', subSource: 'exchange', cost: exchangeCost },
            { source: 'craft', subSource: 'npc', cost: craftingCost } // subSource ignored for craft
        ];

        const valid = candidates.filter(c => c.cost !== null) as { source: 'buy' | 'craft', subSource: 'market' | 'npc' | 'exchange', cost: number }[];

        if (valid.length > 0) {
            // Apply Preference
            const pref = context.sourcePreference || 'optimal';
            let selected = valid[0]; // default to first after potentially sorting

            if (pref === 'optimal') {
                valid.sort((a, b) => a.cost - b.cost);
                selected = valid[0];
            } else if (pref === 'npc') {
                selected = valid.find(v => v.source === 'buy' && v.subSource === 'npc')
                    || valid.find(v => v.source === 'craft')
                    || valid.sort((a, b) => a.cost - b.cost)[0];
            } else if (pref === 'market') {
                selected = valid.find(v => v.source === 'buy' && v.subSource === 'market')
                    || valid.sort((a, b) => a.cost - b.cost)[0];
            }

            optimalCost = selected.cost;
            optimalMethod = selected.source;
            buySource = optimalMethod === 'buy' ? selected.subSource : null;
        }
    }

    // Savings Calculation
    const bestBuy = Math.min(
        directPurchaseCost ?? Infinity,
        npcCost ?? Infinity
    );

    let savings = 0;
    let savingsPercent = 0;
    let savingsLabel = 'No valid options';

    if (craftingCost !== null && bestBuy !== Infinity) {
        if (craftingCost < bestBuy) {
            savings = bestBuy - craftingCost;
            savingsPercent = (savings / bestBuy) * 100;
            savingsLabel = `Craft saves ${Math.round(savingsPercent)}%`;
        } else {
            savings = craftingCost - bestBuy;
            savingsLabel = `Buy saves ${Math.round((savings / craftingCost) * 100)}%`;
        }
    } else if (craftingCost !== null) {
        savingsLabel = "Craft only";
    } else if (bestBuy !== Infinity) {
        savingsLabel = "Buy only";
    }

    return {
        itemId,
        itemName,
        iconUrl: item?.iconUrl,
        quantity,
        directPurchaseCost,
        directPurchaseWorld,
        craftingCost,
        craftingRecipeId: recipe ? recipe.id : null,
        optimalMethod,
        buySource,
        optimalCost,
        purchaseOptions: item?.purchaseOptions,
        savings,
        savingsPercent,
        savingsLabel,
        ingredients
    };
}

function calculateIngredientCost(
    itemId: number,
    quantity: number,
    context: CalculatorContext,
    depth: number
): IngredientCostDetail {
    const item = context.items[itemId];
    const itemName: LocalizedString = item?.name || { en: `Item #${itemId}`, 'zh-Hans': `Item #${itemId}` };

    let npcPrice = item?.npcPrice || null;
    if (npcPrice === 0) npcPrice = null;
    const nCost = npcPrice !== null ? npcPrice * quantity : null;

    const marketData = context.market[itemId];
    let marketPrice: number | null = null;

    if (marketData) {
        const analysis = analyzeMarketData(marketData, quantity, false, false, context.settings);
        if (!analysis.isUntrustworthy) {
            marketPrice = analysis.recommendedPrice;
        }
    }

    const marketCost = marketPrice !== null ? marketPrice * quantity : null;

    // Currency Purchase
    let exchangeCost: number | null = null;
    if (item?.sealCost && context.currencyRates?.seals) {
        exchangeCost = item.sealCost * context.currencyRates.seals * quantity;
    } else if (item?.scripCost && context.currencyRates?.scrips) {
        exchangeCost = item.scripCost * context.currencyRates.scrips * quantity;
    } else if (item?.gemstoneCost && context.currencyRates?.gemstones) {
        exchangeCost = item.gemstoneCost * context.currencyRates.gemstones * quantity;
    }

    // Capture the ACTUAL prices BEFORE override for the UI badges
    const displayMarketPrice = marketPrice;
    const displayNpcPrice = npcPrice;

    // Apply Override for calculation logic
    const calcOverrides = context.overrides || {};
    const override = calcOverrides[itemId];

    // Recursively calculate craft cost
    const breakdown = calculateCraftingCost(itemId, quantity, context, depth);

    let optimalSource: 'npc' | 'market' | 'craft' | 'exchange' = 'market';
    let finalOptimalCost: number | null = null;

    if (breakdown) {
        finalOptimalCost = breakdown.optimalCost;
        if (breakdown.optimalMethod === 'craft') {
            optimalSource = 'craft';
        } else {
            optimalSource = breakdown.buySource || 'market';
        }
    } else {
        const nCostVal = nCost ?? Infinity;
        const mCost = (override !== undefined ? override * quantity : marketCost) ?? Infinity;
        const eCost = exchangeCost ?? Infinity;

        if (nCostVal <= mCost && nCostVal <= eCost) optimalSource = 'npc';
        else if (eCost <= mCost) optimalSource = 'exchange';
        else optimalSource = 'market';

        const costs = [nCostVal, mCost, eCost].filter(c => c !== Infinity);
        if (costs.length > 0) finalOptimalCost = Math.min(...costs);
    }

    return {
        itemId,
        itemName,
        iconUrl: item?.iconUrl,
        quantity,
        depth,
        npcPrice: displayNpcPrice,
        marketPrice: displayMarketPrice,
        craftCost: breakdown?.craftingCost ? (breakdown.craftingCost / quantity) : null,
        optimalSource,
        optimalCost: finalOptimalCost,
        purchaseOptions: item?.purchaseOptions,
        subIngredients: breakdown?.ingredients ?? null
    };
}

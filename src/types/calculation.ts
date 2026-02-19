import { Leve, LocalizedString } from './leve';
import { Item, MarketListing } from './item';
import { JobId } from './job';
import { MarketAnalysisResult } from '@/lib/services/market-analysis';

export interface BonusItemBreakdown {
    itemId: number;
    itemName: LocalizedString;
    iconUrl?: string;
    probability: number;
    count: number;
    isHq: boolean;
    marketPrice: number | null;
    expectedValue: number;
}

export interface BonusExpectedValue {
    perTurninValue: number;
    totalExpectedValue: number;
    breakdown: BonusItemBreakdown[];
}

export interface IngredientCostDetail {
    itemId: number;
    itemName: LocalizedString;
    iconUrl?: string;
    quantity: number;
    depth: number;

    npcPrice: number | null;
    marketPrice: number | null;
    craftCost: number | null;

    optimalSource: 'npc' | 'market' | 'craft' | 'exchange';
    optimalCost: number | null;
    purchaseOptions?: string[];

    subIngredients: IngredientCostDetail[] | null;
}

export interface CraftingCostBreakdown {
    itemId: number;
    itemName: LocalizedString;
    iconUrl?: string;
    quantity: number;

    directPurchaseCost: number | null;
    directPurchaseWorld: string | null;

    craftingCost: number | null;
    craftingRecipeId: number | null;

    optimalMethod: 'buy' | 'craft';
    buySource: 'market' | 'npc' | 'exchange' | null;
    optimalCost: number | null;
    purchaseOptions?: string[];

    savings: number;
    savingsPercent: number;
    savingsLabel: string;

    ingredients: IngredientCostDetail[];
}

export interface LeveCalculation {
    leve: Leve;
    item: Item;
    market: MarketListing | null;
    marketAnalysis: MarketAnalysisResult; // Added for UI warnings

    costNQ: number | null;
    revenueNQ: number;
    profitNQ: number | null;

    costHQ: number | null;
    revenueHQ: number;
    profitHQ: number | null;

    totalXPNQ: number;
    totalXPHQ: number;

    bonusExpectedValue: number;
    bonusBreakdown: BonusExpectedValue | null;

    netProfitNQ: number | null;
    netProfitHQ: number | null;

    optimalQuality: 'NQ' | 'HQ';
    optimalProfit: number | null;
    optimalCost: number | null;
    optimalXP: number;

    freshnessStatus: 'fresh' | 'moderate' | 'stale' | 'unavailable';
    isStale: boolean;
    isUnavailable: boolean;
}

export interface RankedLeveResult {
    calculation: LeveCalculation;
    rank: number;
    score: number;

    craftingBreakdown: CraftingCostBreakdown | null;
    calculationLogs?: string[];

    jobId: JobId;
    jobIcon: string;
}

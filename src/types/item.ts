import { LocalizedString } from './leve';

export interface Item {
    id: number;
    name: LocalizedString;
    iconId?: string; // Not present in current build script
    iconUrl?: string;
    ilvl: number | { value: number }; // XIVAPI v2 sometimes returns object
    canBeHq: boolean; // Note: camelCase match with JSON

    // NPC vendor pricing
    npcPrice: number | null;
    shopPrice?: number;
    vendorSellPrice?: number;
    purchaseOptions?: string[];
    sealCost?: number;
    scripCost?: number;
    gemstoneCost?: number;
}

export interface MarketHistoryEntry {
    pricePerUnit: number;
    quantity: number;
    timestamp: number;
    hq: boolean;
}

export interface MarketListing {
    itemId: number;
    datacenter: string;

    // NQ prices
    minPriceNQ: number | null;
    minPriceNQTax?: number | null;
    averagePriceNQ: number | null;
    medianPriceNQ?: number | null; // Calculated from history
    worldNQ: string | null;

    // HQ prices
    minPriceHQ: number | null;
    minPriceHQTax?: number | null;
    averagePriceHQ: number | null;
    medianPriceHQ?: number | null; // Calculated from history
    worldHQ: string | null;

    // Metadata
    lastUpdated: string; // ISO timestamp
    listingsCount: number;
    regularSaleVelocity: number;
    unitsForSale: number;

    // History
    recentHistory?: MarketHistoryEntry[];
} // Added for advanced analysis


export interface CachedMarketData {
    [itemId: number]: {
        data: MarketListing;
        fetchedAt: string; // ISO timestamp
    };
}

import { MarketListing, CachedMarketData } from '@/types/item';
import { StorageService } from '../storage';

const CACHE_PREFIX = 'leve-calc-market-';
const STALE_MS = 24 * 60 * 60 * 1000; // 24h

export class MarketCache {
    static getCacheKey(dc: string) {
        return `${CACHE_PREFIX}${dc}`;
    }

    /**
     * Get a single item from cache.
     * WARNING: This loads the entire DC cache. Use getMany for multiple items.
     */
    static async get(dc: string, itemId: number): Promise<MarketListing | null> {
        const cache = await StorageService.get<CachedMarketData>(this.getCacheKey(dc), {});
        const entry = cache[itemId];

        if (!entry) return null;

        // We return cached data even if stale, UI handles freshness
        return entry.data;
    }

    /**
     * Get multiple items from cache efficiently (loading storage once).
     */
    static async getMany(dc: string, itemIds: number[]): Promise<Record<number, MarketListing | null>> {
        const cache = await StorageService.get<CachedMarketData>(this.getCacheKey(dc), {});
        const result: Record<number, MarketListing | null> = {};

        itemIds.forEach(id => {
            const entry = cache[id];
            result[id] = entry ? entry.data : null;
        });

        return result;
    }

    static async set(dc: string, listings: MarketListing[]): Promise<void> {
        const key = this.getCacheKey(dc);
        const cache = await StorageService.get<CachedMarketData>(key, {});
        const now = new Date().toISOString();

        listings.forEach(listing => {
            cache[listing.itemId] = {
                data: listing,
                fetchedAt: now
            };
        });

        await StorageService.set(key, cache);
    }

    static isStale(dateIso: string): boolean {
        const fetchedAt = new Date(dateIso).getTime();
        return (Date.now() - fetchedAt) > STALE_MS;
    }
}

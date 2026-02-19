'use client';

import { logger } from '@/lib/logger';
import { useState, useCallback, useRef } from 'react';
import { UniversalisClient } from '@/lib/api/universalis';
import { MarketCache } from '@/lib/api/market-cache';
import { MarketListing } from '@/types/item';

interface UseMarketDataResult {
    marketData: Record<number, MarketListing | null>;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    refreshMarketData: (datacenter: string, itemIds: number[], force?: boolean) => Promise<void>;
}

/**
 * Hook to manage market data fetching from Universalis API.
 * Handles loading states, caching, and error handling.
 * 
 * Fetch market prices from Universalis API
 * Use batch requests (up to 100 items per request)
 * Handle rate limits via exponential backoff
 * Cache market data for up to 24 hours
 */
export function useMarketData(): UseMarketDataResult {
    const [marketData, setMarketData] = useState<Record<number, MarketListing | null>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Negative caching for items not found or invalid
    const failedItemsRef = useRef<Set<number>>(new Set());

    const refreshMarketData = useCallback(async (datacenter: string, itemIds: number[], force = false) => {
        if (!datacenter || itemIds.length === 0) {
            logger.debug('[useMarketData] Skipping refresh: no datacenter or itemIds');
            return;
        }

        logger.info(`[useMarketData] Refresh triggered for ${itemIds.length} items on ${datacenter}, force=${force}`);

        // Clear failed items cache on force refresh
        if (force) {
            logger.debug('[useMarketData] Force refresh: clearing failed items cache');
            failedItemsRef.current.clear();
        }
        setLoading(true);
        setError(null);

        // Keep track of what we tried to fetch to mark as failed on error
        let currentValidToFetch: number[] = [];

        try {
            const cachedData: Record<number, MarketListing | null> = {};
            const itemsToFetch: number[] = [];

            if (force) {
                // If force, we bypass cache and fetch everything
                itemsToFetch.push(...itemIds);
                logger.debug(`[useMarketData] Force refresh: fetching all ${itemsToFetch.length} items from Universalis`);
            } else {
                const cachedResults = await MarketCache.getMany(datacenter, itemIds);

                for (const itemId of itemIds) {
                    const cached = cachedResults[itemId];
                    if (cached) {
                        cachedData[itemId] = cached;
                    } else if (!failedItemsRef.current.has(itemId)) {
                        itemsToFetch.push(itemId);
                    }
                }
                logger.debug(`[useMarketData] Cache hits: ${Object.keys(cachedData).length}, to fetch: ${itemsToFetch.length}, skipped (failed): ${failedItemsRef.current.size}`);
            }

            // Fetch missing items from Universalis
            if (itemsToFetch.length > 0) {
                const validToFetch = itemsToFetch.filter(id => typeof id === 'number' && !isNaN(id) && id > 0);
                currentValidToFetch = validToFetch;

                if (validToFetch.length > 0) {
                    const freshData = await UniversalisClient.getMarketData(datacenter, validToFetch);

                    // Cache new data
                    await MarketCache.set(datacenter, freshData);

                    // Add to result & identify missing items
                    const foundIds = new Set<number>();
                    freshData.forEach(listing => {
                        cachedData[listing.itemId] = listing;
                        foundIds.add(listing.itemId);
                    });

                    // Mark items that were requested but not returned as failed
                    validToFetch.forEach(id => {
                        if (!foundIds.has(id)) {
                            // If entire batch failed (freshData empty), logs might be spammy. 
                            // But usually specific items missing means they are not on market.
                            logger.debug(`[useMarketData] Item ${id} returned no data from ${datacenter} (Universalis), likely untradable.`);
                            failedItemsRef.current.add(id);
                        }
                    });
                }
            }

            setMarketData(prev => {
                const next = { ...prev };
                let hasChange = false;

                Object.entries(cachedData).forEach(([k, v]) => {
                    const key = Number(k);
                    const current = next[key];
                    // Update if new or more recent
                    if (!current || (v && v.lastUpdated !== current.lastUpdated)) {
                        next[key] = v;
                        hasChange = true;
                    }
                });

                if (hasChange) {
                    setLastUpdated(new Date());
                    return next;
                }
                return prev;
            });

        } catch (err) {
            logger.error('[useMarketData] Error fetching market data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch market data');

            // Prevent infinite retry loop by marking attempted items as failed
            if (currentValidToFetch.length > 0) {
                logger.warn(`[useMarketData] Marking ${currentValidToFetch.length} items as failed due to error to prevent spam.`);
                currentValidToFetch.forEach(id => failedItemsRef.current.add(id));
            }

            // Try to use cached data on error
            const fallbackData: Record<number, MarketListing | null> = {};
            const fallbackResults = await MarketCache.getMany(datacenter, itemIds);

            for (const itemId of itemIds) {
                const cached = fallbackResults[itemId];
                if (cached) {
                    fallbackData[itemId] = cached;
                }
            }

            if (Object.keys(fallbackData).length > 0) {
                setMarketData(prev => {
                    const next = { ...prev, ...fallbackData };
                    // Simple merge for fallback
                    return next;
                });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        marketData,
        loading,
        error,
        lastUpdated,
        refreshMarketData,
    };
}

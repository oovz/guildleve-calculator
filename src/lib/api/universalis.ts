import { MarketListing } from '@/types/item';
import { logger } from '@/lib/logger';


interface UniversalisListing {
    pricePerUnit: number;
    hq: boolean;
    worldName?: string;
    tax: number;
    quantity: number;
}


interface UniversalisHistoryEntry {
    pricePerUnit: number;
    quantity: number;
    timestamp: number;
    hq: boolean;
}

interface UniversalisResponse {
    minPriceNQ?: number;
    minPriceHQ?: number;
    currentAveragePriceNQ?: number;
    currentAveragePriceHQ?: number;
    averagePriceNQ?: number;
    averagePriceHQ?: number;
    lastUploadTime: number;
    regularSaleVelocity?: number;
    listingsCount?: number;
    unitsForSale?: number;
    listings?: UniversalisListing[];
    recentHistory?: UniversalisHistoryEntry[];
    items?: Record<number, UniversalisResponse>;
}


const UNIVERSALIS_BASE = 'https://universalis.app/api/v2';

export class UniversalisClient {
    private static RATE_LIMIT_DELAY = 100; // ms between requests safe buffer
    private static lastRequestTime = 0;

    private static async throttle() {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;
        if (timeSinceLast < this.RATE_LIMIT_DELAY) {
            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLast));
        }
        this.lastRequestTime = Date.now();
    }

    // Logic for handling rate limits (simple throttle + exponential backoff if 429)
    private static async fetchWithBackoff(url: string, retries = 3, delay = 1000): Promise<Response> {
        await this.throttle();

        try {
            const res = await fetch(url);
            if (res.status === 429) {
                if (retries === 0) throw new Error('Universalis Rate Limit Exceeded');
                console.warn(`Universalis 429, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithBackoff(url, retries - 1, delay * 2);
            }
            return res;
        } catch (err) {
            throw err;
        }
    }

    static async getMarketData(dc: string, itemIds: number[]): Promise<MarketListing[]> {
        const validItemIds = itemIds.filter(id => typeof id === 'number' && !isNaN(id) && id > 0);
        if (validItemIds.length === 0) return [];

        logger.debug(`[Universalis] Fetching ${validItemIds.length} items for ${dc}`);

        // Chunk items into batches of 100
        const chunks: number[][] = [];
        for (let i = 0; i < validItemIds.length; i += 100) {
            chunks.push(validItemIds.slice(i, i + 100));
        }

        const results: MarketListing[] = [];

        for (const chunk of chunks) {
            const ids = chunk.join(',');
            // Request listings AND entries for history
            const url = `${UNIVERSALIS_BASE}/${dc}/${ids}?listings=10&entries=20`;

            logger.debug(`[Universalis] Requesting: ${url.substring(0, 100)}...`);

            const res = await this.fetchWithBackoff(url);
            if (!res.ok) {
                if (res.status === 404) {
                    logger.debug(`[Universalis] 404 Not Found for chunk ${ids} (Untradable/Invalid items)`);
                } else {
                    console.warn(`[Universalis] Request failed with status ${res.status}`);
                }
                continue;
            }

            const data = await res.json();

            if (chunk.length === 1) {
                results.push(this.transformResponse(data, chunk[0], dc));
            } else if (data.items) {
                chunk.forEach(id => {
                    if (data.items[id]) {
                        results.push(this.transformResponse(data.items[id], id, dc));
                    }
                });
            }
        }

        return results;
    }

    private static calculateMedian(prices: number[]): number | null {
        if (!prices || prices.length === 0) return null;
        const sorted = [...prices].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    private static transformResponse(data: UniversalisResponse, itemId: number, dc: string): MarketListing {
        const history = data.recentHistory || [];

        const nqPrices = history.filter((h) => !h.hq).map((h) => h.pricePerUnit);
        const hqPrices = history.filter((h) => h.hq).map((h) => h.pricePerUnit);

        const lowestNQListing = data.listings?.find((l) => l.hq === false && l.pricePerUnit === data.minPriceNQ);
        const lowestHQListing = data.listings?.find((l) => l.hq === true && l.pricePerUnit === data.minPriceHQ);

        // Normalize tax to unitPrice (Universalis tax is for the whole stack in the listing)
        const unitTaxNQ = lowestNQListing ? (lowestNQListing.tax / (lowestNQListing.quantity || 1)) : null;
        const unitTaxHQ = lowestHQListing ? (lowestHQListing.tax / (lowestHQListing.quantity || 1)) : null;

        return {
            itemId,
            datacenter: dc,
            minPriceNQ: data.minPriceNQ || null,
            minPriceNQTax: unitTaxNQ,
            averagePriceNQ: data.currentAveragePriceNQ || data.averagePriceNQ || null,
            medianPriceNQ: this.calculateMedian(nqPrices),
            worldNQ: lowestNQListing?.worldName || null,
            minPriceHQ: data.minPriceHQ || null,
            minPriceHQTax: unitTaxHQ,
            averagePriceHQ: data.currentAveragePriceHQ || data.averagePriceHQ || null,
            medianPriceHQ: this.calculateMedian(hqPrices),
            worldHQ: lowestHQListing?.worldName || null,
            lastUpdated: new Date(data.lastUploadTime).toISOString(),

            listingsCount: data.listingsCount || data.listings?.length || 0,
            regularSaleVelocity: data.regularSaleVelocity || 0,
            unitsForSale: data.unitsForSale || 0,
            recentHistory: history.map((h) => ({
                pricePerUnit: h.pricePerUnit,
                quantity: h.quantity,
                timestamp: h.timestamp,
                hq: h.hq
            }))
        };
    }
}



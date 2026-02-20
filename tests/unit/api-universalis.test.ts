
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniversalisClient } from '@/lib/api/universalis';

describe('UniversalisClient', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.useFakeTimers();
        // Mock private throttle to avoid waiting in tests
        (UniversalisClient as any).throttle = vi.fn().mockResolvedValue(undefined);
    });

    it('fetches market data and transforms it correctly', async () => {
        const mockResponse = {
            minPriceNQ: 100,
            minPriceHQ: 200,
            lastUploadTime: Date.now(),
            listings: [
                { pricePerUnit: 100, hq: false, worldName: 'TestWorldA', tax: 5, quantity: 1 }
            ],
            recentHistory: [
                { pricePerUnit: 110, hq: false, timestamp: Date.now(), quantity: 1 }
            ]
        };

        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await UniversalisClient.getMarketData('Mana', [1]);

        expect(result.length).toBe(1);
        expect(result[0].minPriceNQ).toBe(100);
        expect(result[0].worldNQ).toBe('TestWorldA');
        expect(result[0].minPriceNQTax).toBe(5);
        expect(result[0].medianPriceNQ).toBe(110);
    });

    it('handles batch requests in chunks of 50', async () => {
        const itemIds = Array.from({ length: 150 }, (_, i) => i + 1);

        // Mock for both chunks
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                items: itemIds.reduce((acc, id) => {
                    acc[id] = { minPriceNQ: id, lastUploadTime: Date.now() };
                    return acc;
                }, {} as any)
            }),
        });

        const result = await UniversalisClient.getMarketData('Mana', itemIds);

        expect(result.length).toBe(150);
        expect(fetch).toHaveBeenCalledTimes(3); // 50 + 50 + 50
    });

    it('retries on 429 rate limit', async () => {
        const mock429 = { status: 429, ok: false };
        const mockSuccess = {
            ok: true,
            json: async () => ({ minPriceNQ: 100, lastUploadTime: Date.now() }),
        };

        (fetch as any)
            .mockResolvedValueOnce(mock429)
            .mockResolvedValueOnce(mockSuccess);

        const fetchPromise = UniversalisClient.getMarketData('Mana', [1]);
        await vi.runAllTimersAsync();
        const result = await fetchPromise;

        expect(result[0].minPriceNQ).toBe(100);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});

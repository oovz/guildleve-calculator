
import { IDataSourceAdapter, RawLeve, RawCraftLeve } from './types';
import { fetchJson } from '../utils';

export const CAFEMAKER_BASE = 'https://cafemaker.wakingsands.com';

export class CafeMakerAdapter implements IDataSourceAdapter {
    baseUrl: string = CAFEMAKER_BASE;

    async fetchLeve(id: number): Promise<RawLeve | null> {
        // CafeMaker often returns flat objects or V1-style
        const data = await fetchJson<unknown>(`${this.baseUrl}/Leve/${id}`, 3); // Higher retries for CN
        if (!data) return null;

        // Wrap in RawLeve structure to satisfy interface
        // CafeMaker data is usually flat, e.g. { Name_chs: "...", ... }
        return {
            row_id: id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fields: data as any
        };
    }

    async fetchCraftLeve(id: number): Promise<RawCraftLeve | null> {
        // CafeMaker might not have CraftLeve exposed the same way or normalized.
        // For now, implementing to satisfy interface but it might not be used if we only use CN for text.
        const data = await fetchJson<unknown>(`${this.baseUrl}/CraftLeve/${id}`);
        if (!data) return null;

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fields: data as any
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchSheet<T>(sheet: string, id: number, fields?: string): Promise<T | null> {
        return await fetchJson<T>(`${this.baseUrl}/${sheet}/${id}`);
    }
}

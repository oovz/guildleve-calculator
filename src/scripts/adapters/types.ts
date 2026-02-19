
export interface LocalizedString {
    en: string;
    zhHans: string;
}

export interface RawLeve {
    row_id: number;
    fields: Record<string, unknown>;
}

export interface RawCraftLeve {
    fields: {
        Item: { value: number }[];
        ItemCount: number[];
        Repeats: number;
    }
}

export interface IDataSourceAdapter {
    baseUrl: string;
    fetchLeve(id: number): Promise<RawLeve | null>;
    fetchCraftLeve(id: number): Promise<RawCraftLeve | null>;
    fetchSheet<T>(sheet: string, id: number, fields?: string): Promise<T | null>;
}

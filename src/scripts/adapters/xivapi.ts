
import { IDataSourceAdapter, RawLeve, RawCraftLeve } from './types';
import { fetchJson } from '../utils';

export const XIVAPI_BASE = 'https://v2.xivapi.com/api';

const LEVE_FIELDS = [
    'Name',
    'ClassJobLevel',
    'ClassJobCategory.BSM',
    'ClassJobCategory.ARM',
    'ClassJobCategory.GSM',
    'ClassJobCategory.CRP',
    'ClassJobCategory.LTW',
    'ClassJobCategory.WVR',
    'ClassJobCategory.ALC',
    'ClassJobCategory.CUL',
    'DataId',
    'GilReward',
    'ExpReward',
    'LeveRewardItem.LeveRewardItemGroup',
    'LeveRewardItem.ProbabilityPercent',
    'Levemete',
    'LeveClient',
    'PlaceName'
].join(',');

const CRAFT_LEVE_FIELDS = [
    'Item',
    'ItemCount',
    'Repeats'
].join(',');

export class XivApiAdapter implements IDataSourceAdapter {
    baseUrl: string = XIVAPI_BASE;

    async fetchLeve(id: number): Promise<RawLeve | null> {
        const url = `${this.baseUrl}/sheet/Leve/${id}?fields=${LEVE_FIELDS}`;
        return await fetchJson<RawLeve>(url);
    }

    async fetchCraftLeve(id: number): Promise<RawCraftLeve | null> {
        const url = `${this.baseUrl}/sheet/CraftLeve/${id}?fields=${CRAFT_LEVE_FIELDS}`;
        return await fetchJson<RawCraftLeve>(url);
    }

    async fetchSheet<T>(sheet: string, id: number, fields?: string): Promise<T | null> {
        const query = fields ? `?fields=${fields}` : '';
        const url = `${this.baseUrl}/sheet/${sheet}/${id}${query}`;
        return await fetchJson<T>(url);
    }
}

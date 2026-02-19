import { LocalizedString } from './leve';

export type JobId = 'CRP' | 'BSM' | 'ARM' | 'GSM' | 'LTW' | 'WVR' | 'ALC' | 'CUL';

export interface Job {
    id: JobId;
    name: LocalizedString;
    iconUrl: string;
    materialIcon: string;
}

export const JOBS: Record<JobId, Job> = {
    CRP: { id: 'CRP', name: { en: 'Carpenter', 'zh-Hans': '刻木匠' }, iconUrl: 'https://xivapi.com/cj/1/carpenter.png', materialIcon: 'handyman' },
    BSM: { id: 'BSM', name: { en: 'Blacksmith', 'zh-Hans': '锻铁匠' }, iconUrl: 'https://xivapi.com/cj/1/blacksmith.png', materialIcon: 'hardware' },
    ARM: { id: 'ARM', name: { en: 'Armorer', 'zh-Hans': '铸甲匠' }, iconUrl: 'https://xivapi.com/cj/1/armorer.png', materialIcon: 'shield' },
    GSM: { id: 'GSM', name: { en: 'Goldsmith', 'zh-Hans': '雕金匠' }, iconUrl: 'https://xivapi.com/cj/1/goldsmith.png', materialIcon: 'diamond' },
    LTW: { id: 'LTW', name: { en: 'Leatherworker', 'zh-Hans': '制革匠' }, iconUrl: 'https://xivapi.com/cj/1/leatherworker.png', materialIcon: 'reorder' },
    WVR: { id: 'WVR', name: { en: 'Weaver', 'zh-Hans': '裁衣匠' }, iconUrl: 'https://xivapi.com/cj/1/weaver.png', materialIcon: 'checkroom' },
    ALC: { id: 'ALC', name: { en: 'Alchemist', 'zh-Hans': '炼金术士' }, iconUrl: 'https://xivapi.com/cj/1/alchemist.png', materialIcon: 'local_drink' },
    CUL: { id: 'CUL', name: { en: 'Culinarian', 'zh-Hans': '烹调师' }, iconUrl: 'https://xivapi.com/cj/1/culinarian.png', materialIcon: 'restaurant' },
};

// Maps numeric ID from data file to string JobId
// Observed: 9 = CRP (Carpenter). Standard is 8. Assuming +1 shift or custom ID.
export const JOB_ID_MAPPING: Record<number, JobId> = {
    9: 'CRP',
    10: 'BSM',
    11: 'ARM',
    12: 'GSM',
    13: 'LTW',
    14: 'WVR',
    15: 'ALC',
    16: 'CUL'
};

import fs from 'fs';
import path from 'path';

// --- Constants ---
import { fetchJson, saveJson, XIVAPI_BASE, CAFEMAKER_BASE } from './common';
import { MANUAL_NPC_MAP, MANUAL_PLACE_MAP, MANUAL_TOWN_MAP } from './manual-mappings';

const npcNameCache: Record<number, string> = {};

const LEVE_FIELDS = 'row_id,Name,ClassJobLevel,ClassJobCategory,JournalGenre,LeveClient,Levemete,Evaluation,PlaceName,Town,GilReward,ExpReward,DataId,LeveRewardItem';

const CRAFT_LEVE_FIELDS = [
    'Item',
    'ItemCount',
    'Repeats'
].join(',');

import { Leve, BonusRewardGroup, BonusRewardItem } from '../src/types/leve';

// --- Types ---
interface LeveV2 {
    row_id: number;
    fields: {
        Name: string;
        ClassJobLevel: number;
        ClassJobCategory: {
            fields: { // Nested fields for Job Categories
                BSM: boolean;
                ARM: boolean;
                GSM: boolean;
                CRP: boolean;
                LTW: boolean;
                WVR: boolean;
                ALC: boolean;
                CUL: boolean;
            }
        };
        DataId: number | { value: number };
        GilReward: number;
        ExpReward: number;
        LeveRewardItem: {
            fields: {
                LeveRewardItemGroup: Array<{
                    row_id: number;
                    fields: {
                        Item: Array<{ value: number }>;
                        Count: number[];
                        IsHQ: boolean[];
                    }
                }>;
                ProbabilityPercent: number[];
            }
        };
        Levemete?: { row_id: number; fields: { Name: string } };
        LeveClient?: { row_id: number; fields: { Name: string } };
        PlaceName?: { row_id: number; fields: { Name: string } };
        Town?: { row_id: number; fields: { Name: string } };
    };
}

interface CraftLeveV2 {
    fields: {
        Item: { value: number }[];
        ItemCount: number[];
        Repeats: number;
    }
}

// --- Helper Functions ---

const craftLeveCache = new Map<number, CraftLeveV2 | null>();

async function fetchCraftLeve(id: number): Promise<CraftLeveV2 | null> {
    if (craftLeveCache.has(id)) return craftLeveCache.get(id)!;
    const url = `${XIVAPI_BASE}/sheet/CraftLeve/${id}?fields=${CRAFT_LEVE_FIELDS}`;
    try {
        const data = await fetchJson<CraftLeveV2>(url);
        craftLeveCache.set(id, data);
        return data;
    } catch (e: any) {
        if (e?.status === 404) return null;
        return null;
    }
}

const levemeteNpcCache = new Map<number, number>();
const leveClientNpcCache = new Map<number, number>();

async function getEnpcIdFromSheet(sheet: string, id: number): Promise<number | null> {
    const cache = sheet === 'Levemete' ? levemeteNpcCache : leveClientNpcCache;
    if (cache.has(id)) return cache.get(id) || null;

    const url = `${XIVAPI_BASE}/sheet/${sheet}/${id}?fields=ENpcResident`;
    try {
        const data = await fetchJson(url);
        if (data && data.fields && data.fields.ENpcResident) {
            let npcId = 0;
            const raw = data.fields.ENpcResident;
            if (typeof raw === 'number') npcId = raw;
            else if (raw && typeof raw === 'object') npcId = raw.value || raw.row_id || 0;

            if (npcId > 0) {
                cache.set(id, npcId);
                return npcId;
            }
        }
    } catch (e) { }
    cache.set(id, 0);
    return null;
}

// --- Main Script ---

async function fetchLeves() {
    console.log("Fetching ALL Leves via Brute Force (0-5000)...");
    const MAX_ID = 5000;
    const allIds = Array.from({ length: MAX_ID }, (_, i) => i);
    const leves: Record<string, any> = {};
    const extractedItemIds = new Set<number>();
    const BATCH_SIZE = 10;
    const chunks = [];
    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        chunks.push(allIds.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;
    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (id) => {
            try {
                const globalUrl = `${XIVAPI_BASE}/sheet/Leve/${id}?fields=${LEVE_FIELDS}`;
                const gData: LeveV2 | null = await fetchJson(globalUrl);
                if (!gData || !gData.fields || !gData.fields.Name) return;

                let jobId = 0;
                const jobFlags = gData.fields.ClassJobCategory?.fields;
                if (!jobFlags) return;
                if (jobFlags.CRP) jobId = 9;
                else if (jobFlags.BSM) jobId = 10;
                else if (jobFlags.ARM) jobId = 11;
                else if (jobFlags.GSM) jobId = 12;
                else if (jobFlags.LTW) jobId = 13;
                else if (jobFlags.WVR) jobId = 14;
                else if (jobFlags.ALC) jobId = 15;
                else if (jobFlags.CUL) jobId = 16;
                if (jobId === 0) return;

                let craftLeveId = 0;
                const rawDataId = gData.fields.DataId;
                if (typeof rawDataId === 'number') craftLeveId = rawDataId;
                else if (rawDataId && typeof rawDataId === 'object' && 'value' in rawDataId) craftLeveId = rawDataId.value;
                if (craftLeveId === 0) return;

                const cData = await fetchCraftLeve(craftLeveId);
                if (!cData || !cData.fields || !cData.fields.Item || cData.fields.Item.length === 0) return;

                const requiredItemId = cData.fields.Item[0].value;
                const requiredQty = cData.fields.ItemCount?.[0] || 0;
                if (requiredItemId === 0) return;
                extractedItemIds.add(requiredItemId);

                const bonusRewards: BonusRewardGroup[] = [];
                const rewardItem = gData.fields.LeveRewardItem;
                if (rewardItem?.fields?.LeveRewardItemGroup) {
                    const groups = rewardItem.fields.LeveRewardItemGroup;
                    const probs = rewardItem.fields.ProbabilityPercent;
                    groups.forEach((group, idx) => {
                        if (group.row_id === 0) return;
                        const prob = (probs[idx] || 0) / 100;
                        if (prob <= 0) return;
                        const items: any[] = [];
                        group.fields.Item?.forEach((itm, iIdx) => {
                            if (itm.value > 0) {
                                items.push({ itemId: itm.value, count: group.fields.Count[iIdx], isHq: group.fields.IsHQ[iIdx] });
                                extractedItemIds.add(itm.value);
                            }
                        });
                        if (items.length > 0) bonusRewards.push({ probability: prob, items });
                    });
                }

                let zhName = gData.fields.Name;
                let zhPlaceName = gData.fields.PlaceName?.fields?.Name || gData.fields.Town?.fields?.Name || '';

                if (gData.fields.PlaceName?.row_id && MANUAL_PLACE_MAP[gData.fields.PlaceName.row_id]) zhPlaceName = MANUAL_PLACE_MAP[gData.fields.PlaceName.row_id];
                else if (gData.fields.Town?.row_id && MANUAL_TOWN_MAP[gData.fields.Town.row_id]) zhPlaceName = MANUAL_TOWN_MAP[gData.fields.Town.row_id];

                let npcId = 0;
                if (gData.fields.Levemete?.row_id) npcId = await getEnpcIdFromSheet('Levemete', gData.fields.Levemete.row_id) || 0;
                else if (gData.fields.LeveClient?.row_id) npcId = await getEnpcIdFromSheet('LeveClient', gData.fields.LeveClient.row_id) || 0;

                const rawIssuer = (gData.fields.Levemete?.fields?.Name || gData.fields.LeveClient?.fields?.Name || '').replace(/^Client:\s*/, '');
                let issuerName: any = { en: rawIssuer };
                let issuerTitle: any = { en: '' };

                if (rawIssuer.includes(',')) {
                    const parts = rawIssuer.split(',');
                    issuerName.en = parts.pop()?.trim() || '';
                    issuerTitle.en = parts.join(',').trim();
                } else {
                    // Handle long names without commas like "Temple Knights Second Commander Ser Handeloup"
                    const knownPrefixes = ['Temple Knights Second Commander', 'First Spear Wood Wailer', '2nd Levy Infantry'];
                    for (const prefix of knownPrefixes) {
                        if (rawIssuer.startsWith(prefix)) {
                            issuerTitle.en = prefix;
                            issuerName.en = rawIssuer.substring(prefix.length).trim();
                            break;
                        }
                    }
                }

                // Handle "Ser ", "Brother ", etc. cleanup for short names
                const namePrefixes = ['Ser ', 'Brother ', 'Sister ', 'Mother ', 'Father ', 'Master '];
                for (const p of namePrefixes) {
                    if (issuerName.en.startsWith(p)) {
                        // We keep the prefix in the full name but maybe we want to store it separately? 
                        // Actually, just leave it as is for now unless it's too long.
                    }
                }

                try {
                    const cnUrl = `${CAFEMAKER_BASE}/Leve/${id}`;
                    const cnData = await fetchJson(cnUrl, 3);
                    if (cnData) {
                        if (cnData.Name_chs) zhName = cnData.Name_chs;
                        if (cnData.PlaceName_chs) {
                            zhPlaceName = typeof cnData.PlaceName_chs === 'object' ? (cnData.PlaceName_chs.Name_chs || cnData.PlaceName_chs.Name || zhPlaceName) : cnData.PlaceName_chs;
                        } else if (cnData.Town_chs) {
                            zhPlaceName = typeof cnData.Town_chs === 'object' ? (cnData.Town_chs.Name_chs || cnData.Town_chs.Name || zhPlaceName) : cnData.Town_chs;
                        }

                        // Fallback for Issuer Name in Chinese if npcId is missing
                        let cnIssuerObj = cnData.Levemete || cnData.LeveClient;
                        if (cnIssuerObj) {
                            const cnIssuerStr = (cnIssuerObj.Name_chs || cnIssuerObj.Name || '').replace(/^Client:\s*/, '');
                            if (cnIssuerStr) {
                                if (cnIssuerStr.includes(' ')) {
                                    // Often in CN, it's "Title Name" no comma
                                    const parts = cnIssuerStr.split(' ');
                                    issuerName['zh-Hans'] = parts.pop();
                                    issuerTitle['zh-Hans'] = parts.join(' ');
                                } else {
                                    issuerName['zh-Hans'] = cnIssuerStr;
                                }
                            }
                        }

                        if (npcId > 0) {
                            const npcUrl = `${CAFEMAKER_BASE}/ENpcResident/${npcId}`;
                            const npcData = await fetchJson(npcUrl, 2);
                            if (npcData) {
                                issuerName['zh-Hans'] = npcData.Name_chs || npcData.Singular_chs || issuerName['zh-Hans'] || issuerName.en;
                                issuerTitle['zh-Hans'] = npcData.Title_chs || npcData.Title || issuerTitle['zh-Hans'] || issuerTitle.en;
                                if (npcData.Name) issuerName.en = npcData.Name;
                                if (npcData.Title) issuerTitle.en = npcData.Title;
                            }
                        }
                    }
                } catch (e) { }

                leves[id] = {
                    id: gData.row_id,
                    name: { en: gData.fields.Name, 'zh-Hans': zhName },
                    level: gData.fields.ClassJobLevel,
                    jobId, requiredItemId, requiredQty,
                    turnins: (cData.fields.Repeats || 0) + 1,
                    repeats: cData.fields.Repeats || 0,
                    rewardGil: gData.fields.GilReward,
                    rewardExp: gData.fields.ExpReward,
                    npcId,
                    issuerName,
                    issuerTitle,
                    turninPlaceName: { en: gData.fields.PlaceName?.fields?.Name || gData.fields.Town?.fields?.Name || '', 'zh-Hans': zhPlaceName },
                    bonusRewards
                };
            } catch (e) { }
        }));
        processedCount += chunk.length;
        if (processedCount % 500 === 0) console.log(`Processed ${processedCount}/${MAX_ID}...`);
    }
    saveJson('leves.json', leves);
}

fetchLeves().catch(console.error);

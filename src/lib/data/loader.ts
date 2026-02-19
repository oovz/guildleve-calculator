import { Leve } from '@/types/leve';
import { Item } from '@/types/item';
import { Recipe } from '@/types/recipe';
// import { JOB_ID_MAPPING } from '@/types/job';

const DATA_BASE = '/data';

async function fetchStaticJson<T>(filename: string): Promise<T> {
    const res = await fetch(`${DATA_BASE}/${filename}`);
    if (!res.ok) {
        throw new Error(`Failed to load ${filename}: ${res.statusText}`);
    }
    return res.json();
}

export const dataLoader = {
    getLeves: async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leves = await fetchStaticJson<Record<string, any>>('leves.json');
        // Map numeric jobId to string JobId
        // Object.values(leves).forEach(leve => {
        //     if (typeof leve.jobId === 'number') {
        //         // leve.jobId = JOB_ID_MAPPING[leve.jobId] || 'CRP';
        //     }
        // });
        return leves as Record<string, Leve>;
    },
    getItems: async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = await fetchStaticJson<Record<string, any>>('items.json');
        Object.values(items).forEach(item => {
            // Transform 'iconId' to XIVAPI format
            if (item.iconId && typeof item.iconId === 'string') {
                item.iconUrl = item.iconId.replace('ui/icon', '/i');
                if (!item.iconUrl.startsWith('/i/')) {
                    item.iconUrl = '/i/' + item.iconUrl;
                }
            }
            if (!item.ilvl) item.ilvl = 0;
        });
        return items as Record<string, Item>;
    },
    getRecipes: async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawRecipes = await fetchStaticJson<Record<string, any>>('recipes.json');



        // Remap recipes to be keyed by result itemId (not recipe id)
        // Remap recipes to be keyed by result itemId (not recipe id)
        // so crafting cost lookup works correctly
        const recipesByItemId: Record<string, Recipe> = {};
        for (const recipeId of Object.keys(rawRecipes)) {
            const recipe = rawRecipes[recipeId];
            const itemId = recipe.itemId;
            // Map to our Recipe type
            recipesByItemId[itemId] = {
                id: recipe.id,
                jobId: recipe.jobId,
                itemId: recipe.itemId,
                yield: recipe.yield || 1,
                level: recipe.level || 1,
                canHq: true,
                ingredients: (recipe.ingredients || []).map((ing: { itemId: number; amount: number }) => ({
                    itemId: ing.itemId,
                    amount: ing.amount
                }))
            };
        }
        return recipesByItemId;
    },
    getDataCenters: () => fetchStaticJson<Record<string, string[]>>('datacenters.json'),
};

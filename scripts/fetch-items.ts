
import * as fs from 'fs';
import * as path from 'path';

import { fetchJson, XIVAPI_BASE, CAFEMAKER_BASE } from './common';

import { Item } from '../src/types/item';

const ITEM_FIELDS = [
    'Name',
    'Icon',
    'PriceMid', // Buy Price
    'PriceLow', // Sell Price
    'CanBeHq',
    'LevelItem'
].join(',');

// --- Helpers ---
// (Moved to common.ts)

async function fetchItems() {
    console.log('Fetching Items based on leves.json...');
    const DATA_DIR = path.resolve('public/data');
    const LEVES_PATH = path.join(DATA_DIR, 'leves.json');
    const ITEMS_PATH = path.join(DATA_DIR, 'items.json');

    if (!fs.existsSync(LEVES_PATH)) {
        console.error('leves.json not found. Run fetch-leves first.');
        process.exit(1);
    }

    const leves = JSON.parse(fs.readFileSync(LEVES_PATH, 'utf-8'));
    const itemIds = new Set<number>();

    // Collect IDs
    Object.values(leves).forEach((leve: any) => {
        if (leve.requiredItemId) itemIds.add(leve.requiredItemId);
        if (leve.bonusRewards) {
            leve.bonusRewards.forEach((grp: any) => {
                grp.items.forEach((itm: any) => itemIds.add(itm.itemId));
            });
        }
    });

    // Collect IDs from Recipes (if exists)
    const RECIPES_PATH = path.join(DATA_DIR, 'recipes.json');
    if (fs.existsSync(RECIPES_PATH)) {
        try {
            const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf-8'));
            Object.values(recipes).forEach((recipe: any) => {
                if (recipe.itemId) itemIds.add(recipe.itemId);
                if (recipe.ingredients) {
                    recipe.ingredients.forEach((ing: any) => itemIds.add(ing.itemId));
                }
            });
            console.log(`Included items from recipes.json.`);
        } catch (e) { console.error(e); }
    }

    console.log(`Found ${itemIds.size} unique items to fetch.`);

    // Fetch Details
    const items: Record<string, Item> = {};
    const ids = Array.from(itemIds);
    const BATCH_SIZE = 10;

    // Stats
    const stats = {
        total: 0,
        localized: 0,
        englishOnly: 0,
        failedIds: [] as number[]
    };

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (id) => {
            // 1. Fetch Global
            const url = `${XIVAPI_BASE}/sheet/Item/${id}?fields=${ITEM_FIELDS}`;
            const gData = await fetchJson(url);
            if (!gData || !gData.fields) return;

            // 2. Fetch CN
            let zhName = gData.fields.Name;
            let isLocalized = false;
            try {
                const cnUrl = `${CAFEMAKER_BASE}/Item/${id}`;
                const cnData = await fetchJson(cnUrl, 2); // Less retries for fallback
                if (cnData) {
                    const cnName = cnData.Name_chs || cnData.Name;
                    if (cnName) {
                        zhName = typeof cnName === 'object' ? (cnName.Name_chs || cnName.Name || zhName) : cnName;
                        isLocalized = true;
                    }
                }
            } catch (e) { }

            // Stats
            stats.total++;
            if (isLocalized) stats.localized++;
            else {
                stats.englishOnly++;
                stats.failedIds.push(id);
            }

            // 3. Construct Item
            items[id] = {
                id: gData.row_id,
                name: { en: gData.fields.Name, 'zh-Hans': zhName },
                iconUrl: gData.fields.Icon?.path
                    ?.replace('.tex', '.png')
                    ?.replace(/^ui\/icon\//, 'https://xivapi.com/i/') || '',
                // Note: Frontend uses iconUrl. Saving as iconUrl to match expected type.
                canBeHq: gData.fields.CanBeHq,
                npcPrice: gData.fields.PriceMid > 0 ? gData.fields.PriceMid : null,
                shopPrice: gData.fields.PriceMid,
                vendorSellPrice: gData.fields.PriceLow,
                ilvl: gData.fields.LevelItem
            };

            // Console every 50
            if (ids.indexOf(id) % 50 === 0) console.log(`Processed Item ${id}`);
        }));
    }

    console.log(`Fetched ${Object.keys(items).length} items.`);
    console.log(`Localization Report:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Localized (ZS): ${stats.localized}`);
    console.log(`  English Only (Fallback): ${stats.englishOnly}`);
    if (stats.englishOnly > 0) {
        if (stats.englishOnly <= 20) {
            console.log(`  Missing IDs: ${stats.failedIds.join(', ')}`);
        } else {
            console.log(`  Missing IDs (First 20): ${stats.failedIds.slice(0, 20).join(', ')}...`);
        }
    }

    fs.writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 2));
}

fetchItems().catch(e => {
    console.error(e);
    process.exit(1);
});

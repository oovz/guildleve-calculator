
import fs from 'fs';
import path from 'path';

import { fetchJson, XIVAPI_BASE, DATA_DIR, delay } from './common';
const RECIPE_MAP_FIELDS = 'row_id,ItemResult.value,CraftType.value,RecipeLevelTable.value';
const RECIPE_DETAIL_FIELDS = 'row_id,ItemResult.value,AmountResult,Ingredient,AmountIngredient,CraftType,RecipeLevelTable';
// Note: We request 'Ingredient' which might expand, but we only do it for needed recipes.

import { Recipe, RecipeIngredient } from '../src/types/recipe';

// --- Types ---

interface RecipeMapItem {
    row_id: number;
    fields: {
        ItemResult: { value: number };
        CraftType: { value: number };
        RecipeLevelTable: { value: { fields: { ClassJobLevel: number } } } | null;
    }
}

interface RecipeDetail {
    row_id: number;
    fields: {
        ItemResult: { value: number };
        AmountResult: number;
        Ingredient: Array<{ value: number }>; // We only care about value
        AmountIngredient: number[];
        CraftType: { value: number };
        RecipeLevelTable: {
            value: number; // The ID
            fields?: { ClassJobLevel: number } // The expanded content
        } | null;
    }
}

// --- Helper Functions ---
// (Moved to common.ts)

// --- Main Script ---

async function fetchRecipes() {
    console.log('Fetching Recipes...');
    const LEVES_PATH = path.join(DATA_DIR, 'leves.json');
    const RECIPES_PATH = path.join(DATA_DIR, 'recipes.json');

    if (!fs.existsSync(LEVES_PATH)) {
        console.error('leves.json not found. Run fetch-leves first.');
        process.exit(1);
    }

    const levesData = JSON.parse(fs.readFileSync(LEVES_PATH, 'utf-8'));
    const neededItemIds = new Set<number>();

    // Extract items from Leves
    Object.values(levesData).forEach((leve: any) => {
        if (leve.requiredItemId) neededItemIds.add(leve.requiredItemId);
        if (leve.bonusRewards) {
            leve.bonusRewards.forEach((grp: any) => {
                grp.items.forEach((itm: any) => neededItemIds.add(itm.itemId));
            });
        }
    });

    console.log(`Initial needed items from Leves: ${neededItemIds.size}`);

    // Phase 1: Build Recipe Map (ItemResult -> [RecipeID...])
    // We iterate all recipe IDs to build this reverse lookup.
    // XIVAPI v2 uses 'rows' parameter for batch fetching by ID.

    console.log('Phase 1: Building Recipe Map...');
    const itemToRecipes = new Map<number, RecipeMapItem[]>();

    const MAX_ID = 60000;
    const BATCH_SIZE = 200;

    for (let startId = 0; startId < MAX_ID; startId += BATCH_SIZE) {
        // Generate batch of IDs: startId, startId+1, ..., startId+BATCH_SIZE-1
        const ids = Array.from({ length: BATCH_SIZE }, (_, i) => startId + i).join(',');

        const url = `${XIVAPI_BASE}/sheet/Recipe?fields=${RECIPE_MAP_FIELDS}&rows=${ids}`;
        const data = await fetchJson(url);

        if (data && data.rows) {
            data.rows.forEach((row: RecipeMapItem) => {
                // Check if row actually has data (sometimes empty rows returned for gaps?)
                if (!row.fields) return;

                const itemId = row.fields.ItemResult?.value;
                if (itemId) {
                    if (!itemToRecipes.has(itemId)) itemToRecipes.set(itemId, []);
                    itemToRecipes.get(itemId)!.push(row);
                }
            });
        }

        if (startId % 5000 === 0) console.log(`Scanned recipes up to ID ${startId}...`);
        // Small delay to be nice
        await delay(50);
    }

    console.log(`Mapped ${itemToRecipes.size} items to recipes.`);

    // Phase 2: Resolve recursively
    console.log('Phase 2: Resolving Dependencies...');

    const resolvedRecipes: Record<string, Recipe> = {};
    const processedItemIds = new Set<number>();
    const processingQueue = Array.from(neededItemIds);

    // We also need to fetch full details for resolved recipes
    // To avoid fetching same recipe twice
    const fetchedRecipeIds = new Set<number>();

    while (processingQueue.length > 0) {
        const itemId = processingQueue.shift()!;
        if (processedItemIds.has(itemId)) continue;
        processedItemIds.add(itemId);

        const candidates = itemToRecipes.get(itemId);
        if (!candidates) continue; // No recipe for this item (vendor only?)

        // For each candidate recipe, we need full details (Ingredients)
        for (const candidate of candidates) {
            if (fetchedRecipeIds.has(candidate.row_id)) continue;
            fetchedRecipeIds.add(candidate.row_id);

            // Fetch details
            // We can batch these fetches if we want, but recursion makes it sequential structure easy.
            // Let's optimize by collecting a batch of recipes to fetch.
            // Actually, let's just fetch individual for now, or implement a bulk fetcher.
            // XIVAPI v2 doesn't have "get multiple rows by ID" easily unless we filter.
            // So individual fetches.

            const detailUrl = `${XIVAPI_BASE}/sheet/Recipe/${candidate.row_id}?fields=${RECIPE_DETAIL_FIELDS}`;
            const detail: RecipeDetail | null = await fetchJson(detailUrl);

            if (!detail || !detail.fields) continue;

            const ingredients: RecipeIngredient[] = [];
            const ingArray = detail.fields.Ingredient || [];
            const amtArray = detail.fields.AmountIngredient || [];

            ingArray.forEach((ing, idx) => {
                const ingId = ing.value;
                const count = amtArray[idx] || 0;

                if (ingId > 0 && count > 0) {
                    ingredients.push({ itemId: ingId, amount: count });
                    // Add to queue if not processed
                    if (!processedItemIds.has(ingId)) {
                        processingQueue.push(ingId);
                    }
                }
            });

            // Map Job ID
            // CRP (0) -> 8
            // ...
            // CUL (7) -> 15
            const craftType = detail.fields.CraftType?.value ?? -1;
            let jobId = 0;
            if (craftType >= 0) {
                jobId = craftType + 8;
            }

            // Recipe Level
            const jobLevel = detail.fields.RecipeLevelTable?.fields?.ClassJobLevel || 0;

            resolvedRecipes[candidate.row_id] = {
                id: candidate.row_id,
                jobId: jobId,
                level: jobLevel,
                itemId: detail.fields.ItemResult.value,
                yield: detail.fields.AmountResult || 1,
                ingredients: ingredients
            };

            if (Object.keys(resolvedRecipes).length % 50 === 0) {
                console.log(`Resolved ${Object.keys(resolvedRecipes).length} recipes...`);
            }
        }
    }

    console.log(`Total resolved recipes: ${Object.keys(resolvedRecipes).length}`);
    fs.writeFileSync(RECIPES_PATH, JSON.stringify(resolvedRecipes, null, 2));

    // Optional: Update items.json with new ingredients that weren't in leves?
    // The instructions say "fetch-recipes ... recursively resolving ingredients".
    // Does that mean we need item details for intermediate ingredients?
    // Yes, probably. Otherwise we can't display them nicely (Name, Icon).
    // So we should verify if we have all needed items in items.json.
    // If not, we should probably run `fetch-items` again or appended?
    // `fetch-items.ts` specifically looks at `leves.json`.
    // Maybe we should update `fetch-items.ts` to ALSO look at `recipes.json`?
    // Or we update `items.json` here?
    // Let's just log the count of missing items for now. 

    // Check missing items
    const allReferencedItems = new Set<number>();
    Object.values(resolvedRecipes).forEach((r: any) => {
        allReferencedItems.add(r.itemId);
        r.ingredients.forEach((i: any) => allReferencedItems.add(i.itemId));
    });

    // We rely on fetch-items.ts to fetch the item details for everything in leves.json + recipes.json
    console.log(`Referenced ${allReferencedItems.size} total items in recipes (products + ingredients).`);
    // fetch-items.ts will aggregate these IDs and fetch details.
}

fetchRecipes().catch(e => {
    console.error(e);
    process.exit(1);
});

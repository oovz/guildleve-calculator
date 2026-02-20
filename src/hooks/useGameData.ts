import useSWR from 'swr';
import { Leve } from '@/types/leve';
import { Item } from '@/types/item';
import { Recipe } from '@/types/recipe';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
});

export interface GameData {
    leves: Record<string, Leve>;
    items: Record<string, Item>;
    recipes: Record<string, Recipe>;
    isLoading: boolean;
    error: unknown;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function useGameData(): GameData {
    const { data: leves, error: leveError, isLoading: leveLoading } = useSWR<Record<string, Leve>>(`${BASE_PATH}/data/leves.json`, fetcher, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

    const { data: items, error: itemError, isLoading: itemLoading } = useSWR<Record<string, Item>>(`${BASE_PATH}/data/items.json`, fetcher, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

    // Raw recipes keyed by recipeId
    const { data: rawRecipes, error: recipeError, isLoading: recipeLoading } = useSWR<Record<string, Recipe>>(`${BASE_PATH}/data/recipes.json`, fetcher, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    });

    // Transform recipes: remap to be keyed by itemId (not recipeId)
    // This is required for crafting cost lookup to work correctly
    const recipes = useMemo(() => {
        if (!rawRecipes) return {};
        const recipesByItemId: Record<string, Recipe> = {};
        for (const recipeId of Object.keys(rawRecipes)) {
            const recipe = rawRecipes[recipeId];
            const itemId = recipe.itemId;
            recipesByItemId[itemId] = recipe;
        }
        return recipesByItemId;
    }, [rawRecipes]);

    return {
        leves: leves || {},
        items: items || {},
        recipes,
        isLoading: leveLoading || itemLoading || recipeLoading,
        error: leveError || itemError || recipeError,
    };
}


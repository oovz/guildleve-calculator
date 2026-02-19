// import { JobId } from './job';

export interface RecipeIngredient {
    itemId: number;
    amount: number;
}

export interface Recipe {
    id: number;
    itemId: number;
    yield: number;
    jobId: number;
    level: number;
    canHq?: boolean;

    // Ingredients
    ingredients: RecipeIngredient[];
}

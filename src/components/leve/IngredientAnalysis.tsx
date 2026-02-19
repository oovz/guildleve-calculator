import { CraftingCostBreakdown, IngredientCostDetail } from "@/types/calculation";
import { useState } from "react";
import { cn, formatGil } from "@/lib/utils";
import { useLocale } from 'next-intl';

interface IngredientAnalysisProps {
    breakdown: CraftingCostBreakdown | null;
}

export function IngredientAnalysis({ breakdown }: IngredientAnalysisProps) {
    const [isOpen, setIsOpen] = useState(true);
    const locale = useLocale();
    const dataLocale = locale === 'zh-Hans' ? 'zh-Hans' : 'en';

    if (!breakdown) return null;

    const rootName = typeof breakdown.itemName === 'string'
        ? breakdown.itemName
        : (breakdown.itemName[dataLocale] || breakdown.itemName.en);

    return (
        <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden flex-grow flex flex-col min-h-0 mt-4">
            <button
                className="w-full flex items-center justify-between p-3 px-4 text-left bg-white/5 hover:bg-white/10 transition-colors focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <span className="material-icons-round text-accent-blue text-lg">account_tree</span>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Recursive Ingredient Analysis</h4>
                </div>
                <span className={cn("material-icons-round text-gray-500 rotate-icon", isOpen && "open")}>expand_more</span>
            </button>

            <div className={cn("accordion-content bg-black/10 overflow-y-auto no-scrollbar", isOpen && "open")}>
                <div className="p-4 space-y-5">
                    {/* Render Tree Nodes */}
                    <div>
                        {/* Root Item (The item we are crafting) */}
                        <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span className="font-bold">{rootName} x{breakdown.quantity}</span>
                            <span className="font-mono text-xs">{formatGil(breakdown.craftingCost)}g</span>
                        </div>

                        <div className="space-y-1 mt-2">
                            {breakdown.ingredients.map((ing, idx) => (
                                <IngredientNode key={`${ing.itemId}-${idx}`} ingredient={ing} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IngredientNode({ ingredient }: { ingredient: IngredientCostDetail }) {
    const hasSubIngredients = ingredient.subIngredients && ingredient.subIngredients.length > 0;
    const locale = useLocale();
    const dataLocale = locale === 'zh-Hans' ? 'zh-Hans' : 'en';

    const name = typeof ingredient.itemName === 'string'
        ? ingredient.itemName
        : (ingredient.itemName[dataLocale] || ingredient.itemName.en);

    return (
        <div className="relative pl-4">
            {/* Tree Line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 tree-line-vertical"></div>
            {/* Horizontal connector */}
            <div className="absolute left-0 top-3 w-3 h-px bg-white/10"></div>

            <div className="flex items-center justify-between py-1 hover:bg-white/5 rounded px-2 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {/* Placeholder icon - ideally we use real icons if available */}
                        <div className="w-3 h-3 bg-gray-500/50 rounded-full"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-300">{name}</span>
                        <span className="text-[9px] text-gray-500">x{ingredient.quantity}</span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs font-mono text-gray-400">
                        {formatGil(ingredient.optimalCost)}g
                    </div>
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${ingredient.optimalSource === 'market' ? 'text-blue-400' : ingredient.optimalSource === 'craft' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {ingredient.optimalSource === 'market' ? 'Market' : ingredient.optimalSource === 'craft' ? 'Craft' : 'Vendor'}
                    </div>
                </div>
            </div>

            {hasSubIngredients && (
                <div className="space-y-1 pt-1">
                    {ingredient.subIngredients!.map((sub, idx) => (
                        <IngredientNode key={`${sub.itemId}-${idx}`} ingredient={sub} />
                    ))}
                </div>
            )}
        </div>
    );
}

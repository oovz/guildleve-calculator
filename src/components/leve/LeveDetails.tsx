import { LeveCalculation, CraftingCostBreakdown, IngredientCostDetail } from '@/types/calculation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { ChevronRight, Store, Coins, Hammer, AlertCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BonusBreakdown } from './BonusBreakdown';
import { MarketWarnings } from './MarketWarnings';
import { useLocale } from 'next-intl';

interface LeveDetailsProps {
    calculation: LeveCalculation;
    breakdown: CraftingCostBreakdown | null;
}

export function LeveDetails({ calculation, breakdown }: LeveDetailsProps) {
    // const t = useTranslations('LeveCard');
    const { revenueNQ, bonusExpectedValue, netProfitNQ, bonusBreakdown } = calculation;

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details" className="border-0">
                <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground hover:no-underline py-2 transition-colors">
                    {/* Trigger Text */}
                    <span className="flex items-center gap-2">
                        <span>Show Cost Breakdown</span>
                    </span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 pt-2">
                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Revenue (NQ)</span>
                                <span>{revenueNQ.toLocaleString()}g</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Est. Bonus</span>
                                <span>+{Math.round(bonusExpectedValue).toLocaleString()}g</span>
                            </div>

                            {/* Bonus Breakdown Visualization */}
                            {bonusBreakdown && (
                                <div className="col-span-2 my-2">
                                    <BonusBreakdown bonusData={bonusBreakdown} />
                                </div>
                            )}

                            {/* Market Analysis Warnings */}
                            <div className="col-span-2 mb-2">
                                <MarketWarnings analysis={calculation.marketAnalysis} />
                                {calculation.market?.lastUpdated && (
                                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 opacity-70">
                                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                                        <span>
                                            Universalis Data: {getRelativeTime(calculation.market.lastUpdated)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between text-muted-foreground border-b border-border/50 pb-1 mb-1 col-span-2 md:col-span-1">
                                <span>Cost ({calculation.optimalQuality})</span>
                                <span className="text-red-400">-{Math.round(calculation.optimalCost || 0).toLocaleString()}g</span>
                            </div>
                            <div className="flex justify-between font-semibold col-span-2 md:col-span-1 border-t md:border-t-0 pt-1 md:pt-0">
                                <span>Net Profit</span>
                                <span className={cn((netProfitNQ || 0) > 0 ? "text-green-600" : "text-red-500")}>
                                    {Math.round(netProfitNQ || 0).toLocaleString()}g
                                </span>
                            </div>
                        </div>

                        {/* Crafting Breakdown Tree */}
                        {breakdown && (
                            <div className="border rounded-md bg-background/50 overflow-hidden">
                                <div className="bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                                    <span>Ingredient Analysis</span>
                                    <span>{breakdown.optimalMethod === 'craft' ? 'Recommendation: Craft' : 'Recommendation: Buy Market'}</span>
                                </div>
                                <div className="p-2 space-y-1">
                                    {breakdown.ingredients.map((ing) => (
                                        <IngredientRow key={ing.itemId} ingredient={ing} depth={0} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

function getRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return `${Math.max(0, Math.round(diffMs / (1000 * 60)))} mins ago`;
    if (diffHours < 24) return `${Math.round(diffHours)} hours ago`;
    return `${Math.round(diffHours / 24)} days ago`;
}

function IngredientRow({ ingredient, depth }: { ingredient: IngredientCostDetail; depth: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasSub = ingredient.subIngredients && ingredient.subIngredients.length > 0;
    const isCrafting = ingredient.optimalSource === 'craft';

    // Indentation
    const paddingLeft = `${depth * 1.5}rem`;

    // Source Icon
    const SourceIcon = () => {
        switch (ingredient.optimalSource) {
            case 'npc': return <Store className="w-3 h-3 text-blue-500" />;
            case 'market': return <Coins className="w-3 h-3 text-yellow-500" />;
            case 'craft': return <Hammer className="w-3 h-3 text-purple-500" />;
            default: return <AlertCircle className="w-3 h-3 text-gray-500" />;
        }
    };

    // Localization
    const locale = useLocale();
    const dataLocale: 'en' | 'zh-Hans' = locale === 'zh-Hans' ? 'zh-Hans' : 'en';
    const displayName = typeof ingredient.itemName === 'object'
        ? (ingredient.itemName[dataLocale] || ingredient.itemName.en)
        : ingredient.itemName;

    return (
        <div className="text-sm">
            <div
                className={cn(
                    "flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 transition-colors",
                    isCrafting && hasSub && "cursor-pointer"
                )}
                style={{ paddingLeft: depth > 0 ? `calc(0.5rem + ${paddingLeft})` : '0.5rem' }}
                onClick={() => isCrafting && hasSub && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* Toggle Icon or Spacer */}
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {isCrafting && hasSub && (
                            <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
                        )}
                    </div>

                    {/* Name & Qty */}
                    <div className="truncate flex items-center gap-2">
                        <span className="font-medium">{ingredient.quantity}x</span>
                        <span className="truncate" title={displayName}>{displayName}</span>
                        <a
                            href={`https://universalis.app/market/${ingredient.itemId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    </div>
                </div>

                {/* Price & Source */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right text-xs">
                        <div className="font-mono">
                            {ingredient.optimalCost !== null ? `${Math.round(ingredient.optimalCost).toLocaleString()}g` : '?'}
                        </div>
                    </div>
                    <Badge variant="outline" className="h-5 px-1.5 gap-1 font-normal text-[10px] min-w-[70px] justify-center bg-background">
                        <SourceIcon />
                        <span className="uppercase">{ingredient.optimalSource}</span>
                    </Badge>
                </div>
            </div>

            {/* Recursion */}
            {isOpen && hasSub && (
                <div className="animate-in slide-in-from-top-1 fade-in-0 duration-200">
                    {ingredient.subIngredients!.map((sub) => (
                        <IngredientRow key={sub.itemId} ingredient={sub} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

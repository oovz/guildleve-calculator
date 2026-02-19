
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import { CraftingCostBreakdown, IngredientCostDetail } from '@/types/calculation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { GilIcon } from '@/components/ui/GilIcon';
import { ShoppingBag, Hammer, User, Package, ExternalLink, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IngredientAnalysisProps {
    breakdown: CraftingCostBreakdown | null;
    isLoading?: boolean;
    localOverrides?: Record<number, { price: number; source: 'market' | 'npc' | 'manual' | 'craft' }>;
    setLocalOverride?: (itemId: number, price: number, source: 'market' | 'npc' | 'manual' | 'craft') => void;
}

export function IngredientAnalysis({ breakdown, localOverrides = {}, setLocalOverride }: IngredientAnalysisProps) {
    const t = useTranslations('LeveDetails');

    if (!breakdown || !breakdown.ingredients || breakdown.ingredients.length === 0) {
        return null;
    }

    return (
        <div className="bg-muted/40 rounded border border-border lg:overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2 p-3 px-4 bg-muted/60 border-b border-border">
                <Hammer className="w-4 h-4 text-secondary" />
                <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">{t('craftRecipe')}</h4>
            </div>
            <div className="p-4 space-y-3 lg:overflow-y-auto no-scrollbar">
                {breakdown.ingredients.map((ingredient, idx) => (
                    <IngredientNode
                        key={ingredient.itemId + '-' + idx}
                        ingredient={ingredient}
                        t={t}
                        isLast={idx === breakdown.ingredients.length - 1}
                        localOverrides={localOverrides}
                        setLocalOverride={setLocalOverride}
                    />
                ))}

                <div className="mt-4 pt-3 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed uppercase tracking-tighter">
                        {t('scriptsSealsWarning')}
                    </p>
                </div>
            </div>
        </div>
    );
}

interface IngredientNodeProps {
    ingredient: IngredientCostDetail;
    t: (key: string) => string;
    isLast?: boolean;
    localOverrides: Record<number, { price: number; source: 'market' | 'npc' | 'manual' | 'craft' }>;
    setLocalOverride?: (itemId: number, price: number, source: 'market' | 'npc' | 'manual' | 'craft') => void;
}


function IngredientNode({ ingredient, t, localOverrides, setLocalOverride }: IngredientNodeProps) {
    const locale = useLocale();
    const getL = (ls: unknown) => {
        const map = ls as Record<string, string | undefined>;
        return map?.[locale] || map?.['zh-Hans'] || map?.en || '---';
    };

    const overrideValue = localOverrides[ingredient.itemId];
    const hasOverride = overrideValue !== undefined;

    // We want to show UNIT PRICE in the input.
    // Default optimal cost in ingredient is for the total quantity.
    const unitPriceRaw = ingredient.optimalCost !== null ? Math.round(ingredient.optimalCost / ingredient.quantity) : 0;

    const [inputValue, setInputValue] = useState(hasOverride ? overrideValue.price.toString() : unitPriceRaw.toString());

    // Update inner input when localOverrides change externally
    useEffect(() => {
        const up = ingredient.optimalCost !== null ? Math.round(ingredient.optimalCost / ingredient.quantity) : 0;
        setInputValue(hasOverride ? overrideValue.price.toString() : up.toString());
    }, [hasOverride, overrideValue, ingredient.optimalCost, ingredient.quantity]);

    const handleBlur = () => {
        if (inputValue.trim() === '') {
            // No action
        } else {
            const num = parseInt(inputValue.replace(/,/g, ''), 10);
            if (!isNaN(num)) setLocalOverride?.(ingredient.itemId, num, 'manual');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    };

    const currentSource = hasOverride ? overrideValue.source : ingredient.optimalSource;
    const showChildren = currentSource === 'craft' && ingredient.subIngredients && ingredient.subIngredients.length > 0;

    return (
        <div className="flex flex-col gap-2">
            <div className={cn(
                "flex justify-between items-center bg-card p-3 rounded border border-border transition-all duration-200 shadow-none",
                hasOverride && "ring-1 ring-secondary bg-secondary/5 border-secondary/20"
            )}>
                <div className="flex gap-3 items-center min-w-0">
                    <div className="w-10 h-10 bg-black border border-border/50 rounded-sm flex items-center justify-center shrink-0 relative overflow-hidden">
                        {ingredient.iconUrl ? (
                            <img
                                src={ingredient.iconUrl}
                                alt={getL(ingredient.itemName)}
                                className="w-8 h-8 object-contain"
                                data-ck-item-id={ingredient.itemId}
                            />
                        ) : (
                            <Package className="w-6 h-6 opacity-10 text-white" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="font-black text-foreground truncate text-sm leading-tight mb-1 uppercase tracking-tight flex items-center gap-1.5">
                            {getL(ingredient.itemName)}
                            <a
                                href={`https://universalis.app/market/${ingredient.itemId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground/30 hover:text-foreground transition-colors"
                            >
                                <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <span className="text-secondary font-mono text-xs ml-1">x{Math.ceil(ingredient.quantity)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                {ingredient.optimalSource === 'craft' ? t('sourceCraft') : ingredient.optimalSource.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5 mb-2 group/price">
                        <input
                            className={cn(
                                "price-input",
                                hasOverride && "text-secondary border-secondary"
                            )}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                        />
                        <GilIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex bg-muted/50 rounded-sm p-0.5 border border-border justify-end gap-0.5 select-none">
                        {/* NPC Source */}
                        <Badge
                            variant="outline"
                            onClick={() => {
                                if (ingredient.npcPrice !== null) {
                                    setLocalOverride?.(ingredient.itemId, ingredient.npcPrice, 'npc');
                                }
                            }}
                            className={cn(
                                "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1 relative",
                                (hasOverride && overrideValue.source === 'npc') || (!hasOverride && ingredient.optimalSource === 'npc')
                                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                                    : "bg-transparent text-muted-foreground/40 border-transparent hover:text-muted-foreground/70"
                            )}>
                            <User className={cn("w-2.5 h-2.5", ((hasOverride && overrideValue.source === 'npc') || (!hasOverride && ingredient.optimalSource === 'npc')) ? "opacity-100" : "opacity-30")} />
                            {ingredient.purchaseOptions?.includes('GC Seals') ? t('badgeSeals') :
                                ingredient.purchaseOptions?.includes('Special Exchange') ? t('badgeExch') :
                                    ingredient.purchaseOptions?.includes('Bicolor Gemstones') ? t('badgeGems') : t('badgeNPC')}
                        </Badge>

                        {/* Market Source */}
                        <Badge
                            variant="outline"
                            onClick={() => {
                                if (ingredient.marketPrice !== null) {
                                    setLocalOverride?.(ingredient.itemId, ingredient.marketPrice, 'market');
                                }
                            }}
                            className={cn(
                                "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1 relative",
                                (hasOverride && overrideValue.source === 'market') || (!hasOverride && ingredient.optimalSource === 'market')
                                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                                    : "bg-transparent text-muted-foreground/40 border-transparent hover:text-muted-foreground/70"
                            )}>
                            <ShoppingBag className={cn("w-2.5 h-2.5", ((hasOverride && overrideValue.source === 'market') || (!hasOverride && ingredient.optimalSource === 'market')) ? "opacity-100" : "opacity-30")} />
                            {t('badgeMB')}
                        </Badge>

                        {/* Craft Source */}
                        {ingredient.craftCost !== null && (
                            <Badge
                                variant="outline"
                                onClick={() => {
                                    setLocalOverride?.(ingredient.itemId, Math.round(ingredient.craftCost!), 'craft');
                                }}
                                className={cn(
                                    "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1 relative",
                                    (hasOverride && overrideValue.source === 'craft') || (!hasOverride && ingredient.optimalSource === 'craft')
                                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                                        : "bg-transparent text-muted-foreground/40 border-transparent hover:text-muted-foreground/70"
                                )}>
                                <Hammer className={cn("w-2.5 h-2.5", ((hasOverride && overrideValue.source === 'craft') || (!hasOverride && ingredient.optimalSource === 'craft')) ? "opacity-100" : "opacity-30")} />
                                {t('badgeCraft')}
                            </Badge>
                        )}

                        {/* Manual / Custom Indicator (Optional) */}
                        {hasOverride && overrideValue.source === 'manual' && (
                            <Badge
                                variant="outline"
                                className="px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white border-amber-600 shadow-sm flex items-center gap-1"
                            >
                                <Info className="w-2.5 h-2.5" />
                                {t('badgeManual')}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showChildren && (
                    <motion.div
                        key="craft-recipe-content"
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 2 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="relative ml-4 pl-4 border-l-2 border-border/50 flex flex-col gap-3 overflow-hidden"
                    >
                        <div className="py-2 flex flex-col gap-3">
                            {ingredient.subIngredients!.map((child, idx) => (
                                <IngredientNode
                                    key={idx}
                                    ingredient={child}
                                    t={t}
                                    isLast={idx === ingredient.subIngredients!.length - 1}
                                    localOverrides={localOverrides}
                                    setLocalOverride={setLocalOverride}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

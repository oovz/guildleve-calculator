import { RankedLeveResult } from '@/types/calculation';
import { useLocale, useTranslations } from 'next-intl';
import { IngredientAnalysis } from './IngredientAnalysis';
import { JobIcon } from '@/components/ui/JobIcon';
import { BonusBreakdown } from './BonusBreakdown';
import { formatGil, getRelativeTime } from '@/lib/utils';

interface BestLeveCardProps {
    result: RankedLeveResult;
}

export function BestLeveCard({ result }: BestLeveCardProps) {
    const locale = useLocale();
    const t = useTranslations('BestLeveCard');
    const { calculation, craftingBreakdown, jobId } = result;
    const { leve, item } = calculation;

    const dataLocale = locale === 'zh-Hans' ? 'zh-Hans' : 'en';

    const leveName = leve.name[dataLocale] || leve.name.en;
    const itemName = item.name[dataLocale] || item.name.en;
    const levemeteName = leve.issuerName?.[dataLocale] || leve.issuerName?.en;
    const issuerTitle = leve.issuerTitle?.[dataLocale] || leve.issuerTitle?.en;

    // Revenue is already computed as total for all turn-ins
    const revenue = calculation.revenueHQ || 0;

    // Total quantity for display
    const totalQty = leve.requiredQty * leve.turnins;

    // Use pre-computed costs from ranking.ts (these are TOTAL costs, not per unit)
    // craftingBreakdown.craftingCost is already total (qty * turnins)
    const totalCraftCost = craftingBreakdown?.craftingCost ?? null;

    // costHQ from calculation is market cost for total qty
    const totalBuyCostMarket = calculation.costHQ;

    // NPC vendor price (if available) - item.npcPrice is per unit
    const npcPricePerUnit = item.npcPrice;
    const totalNpcCost = npcPricePerUnit !== null ? npcPricePerUnit * totalQty : null;

    // Determine if NPC is cheaper than market for NQ
    // NPC only sells NQ, so we compare NPC to NQ market price for fair comparison
    const marketCostNQ = calculation.costNQ;
    const isNpcCheaperNQ = totalNpcCost !== null && (marketCostNQ === null || totalNpcCost < marketCostNQ);

    // For display, show the HQ buy cost from market (the current behavior)
    const totalBuyCost = totalBuyCostMarket;

    // Use pre-computed net profits from ranking.ts (already includes bonus EV)
    // These are the "best possible" profits considering craft vs buy
    const profitCraft = calculation.netProfitHQ ?? (totalCraftCost !== null ? (revenue - totalCraftCost + (calculation.bonusExpectedValue || 0)) : null);
    const profitBuy = calculation.profitHQ; // This is revenue - marketCost (without bonus EV)

    // Determine if we show HQ
    const isHQ = true;

    return (
        <div className="bg-zinc-950 rounded-lg p-5 text-white shadow-lg border border-zinc-800 flex flex-col relative overflow-hidden h-full">
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-5 shrink-0 border-b border-white/5 pb-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-accent-gold font-bold uppercase tracking-[0.2em] mb-0.5">
                            {result.rank === 1 ? t('topRecommendation') : t('leveDetails')}
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight text-white line-clamp-1">{leveName}</h2>
                        {/* NPC Location Info */}
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                            <span className="material-icons-round text-[12px] opacity-70">person</span>
                            <span
                                className="flex items-center gap-1"
                                title={issuerTitle || ''}
                            >
                                <span>{levemeteName || t('levemate')}</span>
                            </span>
                            {leve.turninPlaceName && (
                                <>
                                    <span className="mx-1 opacity-50">•</span>
                                    <span className="material-icons-round text-[12px] opacity-70">place</span>
                                    <span>{leve.turninPlaceName[dataLocale] || leve.turninPlaceName.en}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-right flex items-center justify-end gap-2">
                        <JobIcon jobId={jobId} className="w-8 h-8 rounded" showTooltip />
                        <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">{jobId} Lv. {leve.level}</span>
                    </div>
                </div>

                {/* Item Info */}
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 mb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-black/40 rounded border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden"
                            data-ck-item-id={item.id} >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://xivapi.com${item.iconUrl}`} alt={itemName} className="w-12 h-12 object-contain" />
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0">
                            <div className="text-xl font-bold text-white mb-1 truncate">
                                {itemName} <span className="text-accent-gold font-mono ml-1">[x{totalQty}]</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isHQ && <span className="text-emerald-500/80 text-[10px] font-bold uppercase tracking-tight">{t('highQuality')}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profit Matrix */}
                <div className="bg-zinc-900/50 rounded-lg border border-white/5 overflow-hidden mb-4 shrink-0">
                    <div className="p-4 bg-white/[0.02] border-b border-white/5 grid grid-cols-2 gap-4">
                        {/* Profit Header */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t('estProfit')}</span>
                            <span className="text-2xl font-mono font-bold text-emerald-400 numeric-data flex items-center gap-1.5">
                                {formatGil((calculation.netProfitHQ ?? 0) > (calculation.netProfitNQ ?? 0) ? calculation.netProfitHQ : calculation.netProfitNQ)} <span className="gil-icon w-5 h-5 opacity-80"></span>
                            </span>
                        </div>
                        {/* XP Header */}
                        <div className="flex flex-col border-l border-white/5 pl-4">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Total XP</span>
                            <span className="text-2xl font-mono font-bold text-purple-400 numeric-data">
                                {calculation.totalXPHQ.toLocaleString()} <span className="text-[10px] font-sans font-bold text-gray-500 uppercase">XP</span>
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Craft Column - Only show if craftable */}
                        {totalCraftCost !== null ? (
                            <div className="p-4 border-r border-white/5 bg-emerald-500/[0.02]">
                                <div className="mb-3">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-1">{t('costToCraft')}</span>
                                    <span className="text-sm font-mono font-bold text-gray-300 numeric-data">
                                        {formatGil(totalCraftCost)} <span className="gil-icon opacity-50 text-[10px]"></span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-wider block mb-0.5">{t('profitIfCrafted')}</span>
                                    <span className={`text-xl font-mono font-bold numeric-data ${profitCraft !== null && profitCraft > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {profitCraft !== null ? ((profitCraft > 0 ? '+' : '') + formatGil(profitCraft)) : '---'} <span className="gil-icon w-4 h-4 brightness-110 ml-1"></span>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border-r border-white/5 bg-zinc-900/50 flex flex-col justify-center items-center opacity-50">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t('notCraftable')}</span>
                            </div>
                        )}

                        {/* Buy Column */}
                        <div className="p-4 bg-blue-500/[0.02]">
                            {/* Market Board HQ Price */}
                            <div className="mb-3">
                                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-1">
                                    {t('costToBuy')} <span className="text-blue-400">(HQ)</span>
                                </span>
                                <span className="text-sm font-mono font-bold text-gray-300 numeric-data">
                                    {totalBuyCost !== null && totalBuyCost > 0 ? formatGil(totalBuyCost) : '---'} <span className="gil-icon opacity-50 text-[10px]"></span>
                                </span>
                            </div>

                            {/* NPC Vendor Option (if available) */}
                            {totalNpcCost !== null && (
                                <div className="mb-3 pt-2 border-t border-white/5">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-1 flex items-center gap-1.5">
                                        <span className="material-icons-round text-[10px] text-amber-500">store</span>
                                        NPC Vendor <span className="text-amber-400">(NQ)</span>
                                        {isNpcCheaperNQ && (
                                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">CHEAPER</span>
                                        )}
                                    </span>
                                    <span className="text-sm font-mono font-bold text-amber-300 numeric-data">
                                        {formatGil(totalNpcCost)} <span className="gil-icon opacity-50 text-[10px]"></span>
                                    </span>
                                    <span className="text-[9px] text-gray-500 ml-2">
                                        ({formatGil(npcPricePerUnit)}/ea)
                                    </span>
                                </div>
                            )}

                            <div>
                                <span className="text-[9px] text-blue-400 uppercase font-bold tracking-wider block mb-0.5">{t('profitIfBought')}</span>
                                <span className={`text-xl font-mono font-bold numeric-data ${profitBuy !== null && profitBuy > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                    {profitBuy !== null ? ((profitBuy > 0 ? '+' : '') + formatGil(profitBuy)) : '---'} <span className="gil-icon w-4 h-4 brightness-110 ml-1"></span>
                                </span>
                            </div>
                            {calculation.market?.lastUpdated && (
                                <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-gray-500 text-right italic">
                                    updated {getRelativeTime(calculation.market.lastUpdated)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bonus Breakdown for Top Card */}
                {calculation.bonusBreakdown && (
                    <div className="mb-4">
                        <BonusBreakdown bonusData={calculation.bonusBreakdown} className="bg-zinc-900/50 border-white/5" />
                    </div>
                )}
            </div>

            <IngredientAnalysis breakdown={craftingBreakdown} />
        </div>
    );
}

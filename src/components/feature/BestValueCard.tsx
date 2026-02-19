
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { RankedLeveResult, LeveCalculation, BonusItemBreakdown } from '@/types/calculation';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatGil } from '@/lib/utils';
import { JOBS } from '@/types/job';
import { LocalizedString } from '@/types/leve';
import { GilIcon } from '@/components/ui/GilIcon';
// Card, CardContent removed
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { User, Package, ExternalLink } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface LeveDetailsCardProps {
    result: RankedLeveResult | null;
    isLoading?: boolean;
}

export function LeveDetailsCard({ result, isLoading = false }: LeveDetailsCardProps) {
    const t = useTranslations('LeveDetails');
    const locale = useLocale();
    useSettings();

    const getL = (ls: LocalizedString | undefined | null) => {
        if (!ls) return '---';
        const map = ls as unknown as Record<string, string | undefined>;
        return map[locale] || map['zh-Hans'] || ls.en || '---';
    };

    if (!result) {
        return (
            <div className="bg-muted/40 rounded border border-border h-[400px] flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="bg-background p-3 rounded border border-border">
                    <Package className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{t('noSelectionTitle')}</h3>
                    <p className="text-[11px] text-muted-foreground font-bold max-w-[200px] mx-auto leading-relaxed uppercase tracking-wider">
                        {t('noSelectionDesc')}
                    </p>
                </div>
            </div>
        );
    }

    const { calculation, jobId, craftingBreakdown } = result;
    const { leve, item, optimalProfit, revenueNQ, revenueHQ } = calculation;

    const profit = optimalProfit ?? 0;
    const jobName = JOBS[jobId]?.name ? getL(JOBS[jobId].name) : jobId;
    const revenueValue = calculation.optimalQuality === 'HQ' ? revenueHQ : revenueNQ;

    const craftCost = craftingBreakdown?.craftingCost ?? null;
    const buyCost = craftingBreakdown?.directPurchaseCost ?? null;

    const profitCraft = craftCost !== null ? revenueValue - craftCost + (calculation.bonusExpectedValue || 0) : null;
    const profitBuy = buyCost !== null ? revenueValue - buyCost + (calculation.bonusExpectedValue || 0) : null;

    return (
        <div className="bg-card rounded border border-border p-4 text-foreground shadow-none flex flex-col relative overflow-hidden h-auto" id="selected-leve-overview">
            <div className="flex flex-col gap-0.5 mb-4 shrink-0 border-b border-border/50 pb-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">{t('leveDetailsTitle')}</span>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-[10px] sm:text-[11px] font-black px-2 py-0.5 sm:py-1 border uppercase tracking-widest whitespace-nowrap shrink-0",
                            calculation.optimalQuality === 'HQ'
                                ? "text-secondary bg-secondary/10 border-secondary/20"
                                : "text-muted-foreground bg-muted/50 border-border/50"
                        )}>
                            {calculation.optimalQuality === 'HQ' ? t('hqTarget') : t('nqTarget')}
                        </span>
                        {leve.turnins && leve.turnins > 1 && (
                            <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 sm:py-1 border border-accent-blue/20 bg-accent-blue/10 text-accent-blue uppercase tracking-widest whitespace-nowrap shrink-0">
                                {leve.turnins} {t('turninCount')}
                            </span>
                        )}
                    </div>
                </div>
                <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">{getL(leve.name)}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5">
                        {getL(leve.turninPlaceName)}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5" title={getL(leve.issuerTitle) ? `${getL(leve.issuerTitle)}` : t('issuerLabel')}>
                        <User className="w-2.5 h-2.5 opacity-40 shrink-0" />
                        {t('issuerLabel')}: {getL(leve.issuerName)}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5">
                        {jobName} LV.{leve.level}
                    </span>
                </div>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded p-3 mb-3 shrink-0">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-black border border-border/50 rounded-sm flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner">
                        {item?.iconUrl ? (
                            <img src={item.iconUrl} alt={getL(item.name)} className="w-10 h-10 object-contain" data-ck-item-id={item.id} />
                        ) : (
                            <Package className="w-8 h-8 text-white opacity-10" />
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-foreground text-background text-xs font-black px-1.5 rounded-sm">
                            x{leve.requiredQty}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-base font-black text-foreground truncate uppercase tracking-tight">
                                {getL(item?.name)}
                                <a
                                    href={`https://universalis.app/market/${item.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                        <BonusItemsSection calculation={calculation} />
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-1 shrink-0">
                <div className="bg-background border border-border rounded overflow-hidden">
                    <div className="p-3 bg-muted/20 border-b border-border">
                        <div className="flex justify-between items-center">
                            <span className={cn(
                                "text-xs uppercase font-black tracking-[0.2em]",
                                profit >= 0 ? "text-muted-foreground" : "text-destructive"
                            )}>
                                {profit >= 0 ? t('estNetProfit') : t('estNetLoss')}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className={cn(
                                    "text-xl font-mono font-black tracking-tighter",
                                    profit >= 0 ? "text-foreground" : "text-destructive"
                                )}>
                                    {isLoading ? '---' : formatGil(profit)}
                                </span>
                                <GilIcon className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-border">
                        <div className={cn(
                            "p-3 transition-all",
                            craftingBreakdown?.optimalMethod === 'craft' ? "bg-emerald-500/5" : ""
                        )}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{t('craftCost')}</span>
                                {craftingBreakdown?.optimalMethod === 'craft' && (
                                    <span className="text-[10px] text-emerald-500 font-black uppercase">{t('bestLabel')}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-mono font-black tracking-tighter text-foreground">
                                    {craftCost !== null ? formatGil(craftCost) : '---'}
                                </span>
                                <GilIcon className="w-3 h-3" />
                            </div>
                        </div>
                        <div className={cn(
                            "p-3 transition-all",
                            craftingBreakdown?.optimalMethod === 'buy' ? "bg-accent-cool/5" : ""
                        )}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                    {t('purchasingCost')}
                                    {craftingBreakdown?.buySource && (
                                        <span className="ml-1 opacity-60">{t('viaMethod', { method: craftingBreakdown.buySource.toUpperCase() })}</span>
                                    )}
                                </span>
                                {craftingBreakdown?.optimalMethod === 'buy' && (
                                    <span className="text-[10px] text-accent-cool font-black uppercase">{t('bestLabel')}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-mono font-black tracking-tighter text-foreground">
                                    {buyCost !== null ? formatGil(buyCost) : '---'}
                                </span>
                                <GilIcon className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}


function BonusItemsSection({ calculation }: { calculation: LeveCalculation }) {
    const t = useTranslations('LeveDetails');
    const locale = useLocale();
    const breakdown = calculation.bonusBreakdown?.breakdown || [];

    if (breakdown.length === 0) return null;

    return (
        <div className="w-full">
            <Accordion type="single" collapsible className="w-full border-none">
                <AccordionItem value="bonus" className="border-none">
                    <AccordionTrigger className="py-0 hover:no-underline group">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-accent-gold/10 text-accent-gold border-none font-black text-xs uppercase tracking-widest px-2 group-hover:bg-accent-gold/20 transition-colors">
                                {t('guaranteedBonus')}
                            </Badge>
                            <div className="flex -space-x-1.5">
                                {breakdown.slice(0, 3).map((b, i) => (
                                    b.iconUrl && <img key={i} src={b.iconUrl} alt="" className="w-5 h-5 rounded-sm border-2 border-background shadow-sm" data-ck-item-id={b.itemId} />
                                ))}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 px-1">
                        <div className="space-y-3">
                            {breakdown.map((bonus: BonusItemBreakdown, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs group/item">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-7 h-7 bg-black rounded-sm border border-border/50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                            {bonus.iconUrl && <img src={bonus.iconUrl} className="w-5 h-5 object-contain" alt="" data-ck-item-id={bonus.itemId} />}
                                            <div className="absolute -bottom-1 -right-1 bg-foreground text-background text-[10px] font-black px-1 rounded-sm leading-none py-0.5">
                                                x{bonus.count}
                                            </div>
                                        </div>
                                        <span className="font-black text-foreground truncate uppercase tracking-tighter opacity-80 group-hover/item:opacity-100 transition-opacity">
                                            {(typeof bonus.itemName === 'object' ? (bonus.itemName[locale as 'en' | 'zh-Hans'] || bonus.itemName['zh-Hans'] || bonus.itemName.en) : bonus.itemName)}
                                        </span>
                                        <a
                                            href={`https://universalis.app/market/${bonus.itemId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="opacity-0 group-hover/item:opacity-40 hover:!opacity-100 transition-opacity"
                                        >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0 pl-4">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center gap-1 opacity-40 text-[10px] font-bold">
                                                <span>{formatGil((bonus.marketPrice || 0) * bonus.count)}</span>
                                                <GilIcon className="w-2 h-2" />
                                                <span className="ml-1">× {Math.round(bonus.probability * 100)}%</span>
                                            </div>
                                            <div className="flex items-center gap-1 min-w-[60px] justify-end">
                                                <span className="font-bold text-accent-cool">{formatGil(bonus.expectedValue)}</span>
                                                <GilIcon className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

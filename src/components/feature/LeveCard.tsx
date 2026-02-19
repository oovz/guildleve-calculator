
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { RankedLeveResult } from '@/types/calculation';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { JOBS } from '@/types/job';
import { useSettings } from '@/lib/context/SettingsContext';
import { GilIcon } from '@/components/ui/GilIcon';
import { formatGil } from '@/lib/utils';
// Badge, ChevronRight, MapPin removed

export interface LeveCardProps {
    result: RankedLeveResult;
    onClick?: () => void;
    isSelected?: boolean;
}

export function LeveCard({ result, onClick, isSelected }: LeveCardProps) {
    const locale = useLocale();
    // tCommon removed
    const { preferences } = useSettings();

    const getL = (ls: unknown) => {
        const map = ls as Record<string, string | undefined>;
        return map?.[locale] || map?.['zh-Hans'] || map?.en || '---';
    };

    const { calculation, jobId } = result;
    const { leve, item, optimalProfit } = calculation;

    const name = getL(leve.name);
    const itemName = getL(item?.name);
    const profit = optimalProfit ?? 0;
    const isProfit = profit > 0;

    const jobKey = jobId;
    const t = useTranslations('LeveDetails');
    const tCommon = useTranslations('Common');

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative border-y-0 transition-all duration-100 cursor-pointer overflow-hidden p-3 h-full flex flex-col justify-center",
                isSelected
                    ? "bg-accent-blue/5 border-l-[4px] border-l-accent-blue z-10"
                    : "bg-background hover:bg-muted/50 border-l-[4px] border-l-transparent hover:border-l-muted-foreground/20"
            )}
        >
            <div className="flex items-center gap-3">
                {/* Level Indicator */}
                <div className="flex flex-col items-center justify-center w-8 shrink-0">
                    <span className="text-[10px] font-black font-mono text-muted-foreground leading-none">
                        {leve.level}
                    </span>
                    <div className={cn(
                        "w-5 h-5 mt-1 flex items-center justify-center opacity-40",
                        JOBS[jobKey as keyof typeof JOBS] ? "" : "hidden"
                    )}>
                        {JOBS[jobKey as keyof typeof JOBS]?.iconUrl && (
                            <img src={JOBS[jobKey as keyof typeof JOBS].iconUrl} alt={jobKey} className="w-full h-full object-contain grayscale" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-sm text-foreground truncate uppercase tracking-tight">
                            {name}
                        </h4>
                        <span className="text-[11px] font-black text-secondary/80 font-mono ml-2">
                            {leve.turnins && leve.turnins > 1 ? `${leve.requiredQty}x${leve.turnins}` : `x${leve.requiredQty}`}
                        </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-bold truncate uppercase tracking-wider mt-0.5">
                        {itemName}
                    </div>
                </div>

                {/* Metrics */}
                <div className="text-right shrink-0">
                    <div className={cn(
                        "font-mono font-bold text-sm tracking-tighter flex items-center justify-end gap-1.5",
                        preferences.mode === 'leveling' ? "text-secondary" : (isProfit ? "text-emerald-500" : "text-destructive")
                    )}>
                        {preferences.mode === 'leveling'
                            ? calculation.totalXPHQ.toLocaleString()
                            : (isProfit ? '+' : '') + formatGil(profit)
                        }
                        {preferences.mode === 'leveling' ? (
                            <span className="text-[11px] font-black opacity-80">{tCommon('xp').replace(':', '')}</span>
                        ) : (
                            <GilIcon className="w-3.5 h-3.5" />
                        )}
                    </div>
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mt-1">
                        {preferences.mode === 'leveling' ? t('totalYield') : (isProfit ? t('estProfitCap') : t('estLossCap'))}
                    </div>
                </div>
            </div>
        </div>
    );
}


import { RankedLeveResult } from '@/types/calculation';
import { useLocale } from 'next-intl';
import { cn, formatGil } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { GilIcon } from '@/components/ui/GilIcon';


interface LeveCardProps {
    result: RankedLeveResult;
    isSelected?: boolean;
    onSelect?: () => void;
    sortBy?: 'profit' | 'xp' | 'ratio';
}

export function LeveCard({ result, isSelected, onSelect, sortBy = 'profit' }: LeveCardProps) {
    const locale = useLocale();

    const { calculation } = result;
    const dataLocale = locale === 'zh-Hans' ? 'zh-Hans' : 'en';

    const { leve, item, optimalProfit, totalXPHQ } = calculation;
    const leveName = leve.name[dataLocale] || leve.name.en;
    const levemeteName = leve.issuerName?.[dataLocale] || leve.issuerName?.en;

    // Logic for display metrics
    let displayValue: React.ReactNode;
    let displayLabel: string;
    let valueClass: string;
    const isProfitable = (optimalProfit || 0) > 0;

    if (sortBy === 'xp') {
        displayValue = totalXPHQ.toLocaleString();
        displayLabel = 'Total XP';
        valueClass = "text-purple-400 dark:text-purple-300";
    } else if (sortBy === 'ratio') {
        // Ratio = XP / Net Cost where Net Cost = Cost - Revenue
        // If profitable (NetCost <= 0), display as ∞ (infinite efficiency)
        // If no cost data available, show N/A

        if (calculation.optimalCost === null) {
            displayValue = "N/A";
            valueClass = "text-gray-400";
        } else {
            const revenue = calculation.optimalQuality === 'HQ' ? calculation.revenueHQ : calculation.revenueNQ;
            const netCost = calculation.optimalCost - revenue;

            if (netCost <= 0) {
                displayValue = "∞";
                valueClass = "text-emerald-500";
            } else {
                const ratio = totalXPHQ / netCost;
                // Format ratio: if > 1000, show as "1.2K", otherwise show decimal
                if (ratio >= 1000) {
                    displayValue = `${(ratio / 1000).toFixed(1)}K`;
                } else {
                    displayValue = ratio.toFixed(1);
                }
                valueClass = "text-blue-500 dark:text-blue-400";
            }
        }
        displayLabel = 'XP / Net Cost';
    } else {
        // Profit (Default)
        displayValue = (
            <>
                {isProfitable ? '+' : ''}{formatGil(optimalProfit)} <GilIcon className={cn("w-4 h-4", !isProfitable && "grayscale")} />
            </>
        );
        displayLabel = isProfitable ? 'Est. Profit' : 'Est. Loss';
        valueClass = isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
    }

    return (
        <div
            className={cn(
                "rounded-lg border shadow-sm transition-all overflow-hidden cursor-pointer",
                isSelected
                    ? "bg-accent-blue/5 border-accent-blue ring-1 ring-accent-blue"
                    : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-accent-blue/30"
            )}
            onClick={onSelect}
        >
            <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className="w-10 h-10 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center shrink-0 relative overflow-hidden"
                    data-ck-item-id={item.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.iconUrl?.startsWith('http') ? item.iconUrl : `https://xivapi.com${item.iconUrl}`}
                        alt={item.name[dataLocale] || item.name.en}
                        className="w-8 h-8 object-contain"
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={cn("font-bold text-sm truncate", isSelected ? "text-accent-blue" : "text-gray-900 dark:text-white")}>
                            {leveName} <span className="text-accent-gold font-mono ml-1">[x{leve.turnins}]</span>
                        </h4>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span className="font-bold text-gray-400 mr-0.5">Lv.{leve.level}</span>
                        <span className="truncate">{item.name[dataLocale] || item.name.en}</span>
                        <a
                            href={`https://universalis.app/market/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground/40 hover:text-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    </div>
                    {levemeteName && (
                        <div className="text-[9px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                            {levemeteName}
                        </div>
                    )}
                </div>

                {/* Profit/Stats */}
                <div className="text-right shrink-0 pl-6 border-l border-gray-100 dark:border-zinc-800 min-w-[100px]">
                    <div className={cn("font-mono font-bold text-sm numeric-data flex items-center justify-end gap-1", valueClass)}>
                        {sortBy !== 'xp' && sortBy !== 'ratio' ? (
                            <>
                                {isProfitable ? '+' : ''}{formatGil(optimalProfit)} <GilIcon className={cn("w-3.5 h-3.5", !isProfitable && "grayscale opacity-50")} />
                            </>
                        ) : displayValue}
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{displayLabel}</div>
                </div>
            </div>
        </div>
    );
}

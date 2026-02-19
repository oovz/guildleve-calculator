import { BonusExpectedValue } from '@/types/calculation';
import { cn, formatGil } from '@/lib/utils';
import { GilIcon } from '@/components/ui/GilIcon';
import { useLocale } from 'next-intl';

interface BonusBreakdownProps {
    bonusData: BonusExpectedValue | null;
    className?: string;
}

export function BonusBreakdown({ bonusData, className }: BonusBreakdownProps) {
    const locale = useLocale();
    // 'zh-Hans' in locale string vs 'zh-Hans' key in object
    // Looking at data, it seems to be consistently 'zh-Hans' or 'en'.
    // We should safely handle the lookup.

    if (!bonusData || !bonusData.breakdown || bonusData.breakdown.length === 0) {
        return null;
    }

    const getName = (name: string | { en: string, 'zh-Hans'?: string }) => {
        if (typeof name === 'string') return name;
        if (locale === 'zh-Hans') return name['zh-Hans'] || name.en;
        return name.en;
    };

    return (
        <div className={cn("bg-zinc-900/30 rounded-lg p-3 border border-white/5", className)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bonus Items</span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                    +{formatGil(bonusData.totalExpectedValue)} <GilIcon className="w-3 h-3" />
                </span>
            </div>

            <div className="space-y-1">
                {bonusData.breakdown.map((item, idx) => (
                    <div key={`${item.itemId}-${idx}`} className="flex items-center justify-between text-[11px] group">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1 h-1 rounded-full bg-accent-gold/50"></div>
                            <span className="text-gray-300 truncate group-hover:text-white transition-colors">
                                {getName(item.itemName)} <span className="text-gray-600">x{item.count}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-gray-600 w-12 text-right">{(item.probability * 100).toFixed(0)}%</span>
                            <span className="font-mono text-gray-400 w-16 text-right">
                                {formatGil(item.marketPrice)}g
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-[9px] text-gray-600 text-right italic">
                * Based on average market price
            </div>
        </div>
    );
}

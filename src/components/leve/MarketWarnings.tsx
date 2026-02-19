
import React from 'react';
import { MarketAnalysisResult } from '@/lib/services/market-analysis';
import { AlertTriangle } from 'lucide-react';

interface Props {
    analysis: MarketAnalysisResult;
}

export function MarketWarnings({ analysis }: Props) {
    if (analysis.reliabilityScore >= 80) return null;

    return (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest leading-none">
                    Reliability: {Math.round(analysis.reliabilityScore)}%
                </span>
            </div>
            <ul className="space-y-1.5 pl-8">
                {analysis.warnings.map((w, i) => (
                    <li key={i} className="text-[10px] font-bold text-amber-600/80 dark:text-amber-500/60 uppercase tracking-tight italic">
                        • {w}
                    </li>
                ))}
            </ul>
        </div>
    );
}

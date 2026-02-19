
import React from 'react';
import { LeveDetailsCard } from './BestValueCard';
import { IngredientAnalysis } from './IngredientAnalysis';
import { RankedLeveResult } from '@/types/calculation';

interface SidebarProps {
    bestResult: RankedLeveResult | null;
    isLoading?: boolean;
    localOverrides?: Record<number, { price: number; source: 'market' | 'npc' | 'manual' | 'craft' }>;
    setLocalOverride?: (itemId: number, price: number, source: 'market' | 'npc' | 'manual' | 'craft') => void;
}

export function Sidebar({ bestResult, isLoading = false, localOverrides = {}, setLocalOverride }: SidebarProps) {
    return (
        <aside className="lg:h-full flex flex-col z-20 gap-4" id="selected-leve-overview">
            <div className="shrink-0">
                <LeveDetailsCard result={bestResult} isLoading={isLoading} />
            </div>

            {bestResult && bestResult.craftingBreakdown && (
                <div className="lg:min-h-0 lg:flex-1 flex flex-col lg:overflow-hidden">
                    <IngredientAnalysis
                        breakdown={bestResult.craftingBreakdown}
                        isLoading={isLoading}
                        localOverrides={localOverrides}
                        setLocalOverride={setLocalOverride}
                    />
                </div>
            )}
        </aside>
    );
}

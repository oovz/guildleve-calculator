import { Leve } from '@/types/leve';

export interface XPResult {
    totalXPNQ: number;
    totalXPHQ: number;
}

export function calculateXP(leve: Leve): XPResult {
    const base = leve.rewardExp * leve.turnins;
    return {
        totalXPNQ: base,
        totalXPHQ: base * 2 // HQ XP bonus is 2x
    };
}

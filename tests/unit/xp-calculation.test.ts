
import { describe, it, expect } from 'vitest';
import { calculateXP } from '@/lib/calculation/xp';
import { Leve } from '@/types/leve';

describe('XP Calculation', () => {
    it('calculates total XP correctly for NQ and HQ', () => {
        const mockLeve: Leve = {
            rewardExp: 1000,
            turnins: 3,
        } as any;

        const result = calculateXP(mockLeve);

        // base = 1000 * 3 = 3000
        expect(result.totalXPNQ).toBe(3000);
        expect(result.totalXPHQ).toBe(6000); // 3000 * 2
    });

    it('handles single turnin correctly', () => {
        const mockLeve: Leve = {
            rewardExp: 500,
            turnins: 1,
        } as any;

        const result = calculateXP(mockLeve);

        expect(result.totalXPNQ).toBe(500);
        expect(result.totalXPHQ).toBe(1000);
    });
});

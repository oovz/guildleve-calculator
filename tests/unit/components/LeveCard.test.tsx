
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Fix types
import { LeveCard, LeveCardProps } from '@/components/feature/LeveCard';
import { Leve } from '@/types/leve';
import { Item } from '@/types/item';
import { vi, describe, it, expect } from 'vitest';
import { RankedLeveResult } from '@/types/calculation';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/lib/context/SettingsContext', () => ({
    useSettings: () => ({
        preferences: { mode: 'profit' }
    })
}));

const mockLeve: Leve = {
    id: 1,
    name: { en: 'Test Leve', 'zh-Hans': 'Test Leve ZH' },
    level: 10,
    jobId: 9, // CRP
    issuerName: { en: 'Issuer', 'zh-Hans': 'Issuer ZH' },
    requiredItemId: 100,
    requiredQty: 3,
    turnins: 1,
    rewardGil: 100,
    rewardExp: 1000,
    npcId: 1,
    bonusRewards: [],
    turninPlaceName: { en: 'Test Place', 'zh-Hans': 'Test Place ZH' }
};

const mockItem: Item = {
    id: 100,
    name: { en: 'Test Item', 'zh-Hans': 'Test Item ZH' },
    iconUrl: '/item.png',
    canBeHq: true,
    ilvl: 10,
    npcPrice: 10,
};

const mockResult = {
    calculation: {
        leve: mockLeve,
        item: mockItem,
        profitNQ: 500,
        profitHQ: 1000,
        optimalQuality: 'NQ' as const,
        optimalProfit: 500,
        freshnessStatus: 'fresh' as const,
        totalXPNQ: 2000,
        totalXPHQ: 3000,
        revenueNQ: 600,
        revenueHQ: 1200,
    } as any,
    jobId: 'CUL',
    rank: 1
} as unknown as RankedLeveResult;

const messages = {
    LeveCard: {
        profit: 'Profit',
        optimalProfit: 'Optimal Profit',
        optimalQuality: 'Optimal Quality',
        fresh: 'Fresh',
        stale: 'Stale',
        veryStale: 'Very Stale',
        leve: 'Leve',
        item: 'Item',
        level: 'Lv.',
        turnins: 'Turnins',
        rewardGil: 'Gil',
        rewardExp: 'Exp',
        cost: 'Cost',
        revenue: 'Revenue',
        profitNQ: 'Profit (NQ)',
        profitHQ: 'Profit (HQ)',
        optimal: 'Optimal',
        quality: 'Quality',
        hq: 'HQ',
        nq: 'NQ',
    },
    // Add other necessary messages if LeveCard uses them
};

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string) => key
}));

describe('LeveCard Component', () => {
    const mockOnClick = vi.fn();

    it('renders basic info correctly', () => {
        render(
            <LeveCard
                result={mockResult}
                onClick={mockOnClick}
            />
        );

        expect(screen.getByText(/Test Leve/)).toBeInTheDocument();
        expect(screen.getByText(/Test Item/)).toBeInTheDocument();
        expect(screen.getByText(/\+500/)).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        render(
            <LeveCard
                result={mockResult}
                onClick={mockOnClick}
            />
        );

        const card = screen.getByText(/Test Leve/).closest('div');
        // The div is now the click target, ensure we find clickable element
        fireEvent.click(screen.getByText(/Test Leve/));
        expect(mockOnClick).toHaveBeenCalled();
    });
});

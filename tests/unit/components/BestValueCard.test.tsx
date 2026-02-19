
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LeveDetailsCard } from '@/components/feature/BestValueCard';
import { vi, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'en'
}));

vi.mock('@/lib/context/SettingsContext', () => ({
    useSettings: () => ({})
}));

describe('BestValueCard Component', () => {
    const mockResult = {
        calculation: {
            leve: {
                id: 1,
                name: { en: 'Leve Name', 'zh-Hans': 'Leve Name ZH' },
                level: 50,
                turninPlaceName: { en: 'Place', 'zh-Hans': 'Place ZH' },
                issuerName: { en: 'Issuer', 'zh-Hans': 'Issuer ZH' },
                requiredQty: 3
            },
            item: {
                id: 100,
                name: { en: 'Item Name', 'zh-Hans': 'Item Name ZH' },
                iconUrl: '/item.png'
            },
            optimalProfit: 1000,
            optimalQuality: 'HQ',
            revenueNQ: 500,
            revenueHQ: 1200,
            bonusExpectedValue: 100
        },
        jobId: 'CUL',
        craftingBreakdown: {
            optimalMethod: 'craft',
            craftingCost: 300,
            directPurchaseCost: 500
        }
    } as any;

    it('renders "no selection" state when result is null', () => {
        render(<LeveDetailsCard result={null} />);
        expect(screen.getByText('noSelectionTitle')).toBeInTheDocument();
    });

    it('renders leve and profit information correctly', () => {
        render(<LeveDetailsCard result={mockResult} />);

        expect(screen.getByText('Leve Name')).toBeInTheDocument();
        expect(screen.getByText('Item Name')).toBeInTheDocument();
        expect(screen.getByText('1,000')).toBeInTheDocument(); // Profit
        expect(screen.getByText('300')).toBeInTheDocument();  // Craft cost
        expect(screen.getByText('500')).toBeInTheDocument();  // Buy cost
    });

    it('highlights the optimal method', () => {
        render(<LeveDetailsCard result={mockResult} />);

        // "bestLabel" should be near "300" (craft cost) but not "500" (buy cost)
        const bestLabels = screen.getAllByText('bestLabel');
        expect(bestLabels.length).toBe(1);
    });
});

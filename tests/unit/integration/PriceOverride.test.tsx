
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PriceOverrideProvider, usePriceOverrides } from '@/lib/context/PriceOverrideContext';
import { LeveDetailDialog } from '@/components/feature/LeveDetailDialog';
import { LeveCalculation } from '@/types/calculation';
import { vi, describe, it, expect } from 'vitest';

// Mock calculation object
const mockCalculation: LeveCalculation = {
    // Basic fields required by LeveDetailDialog
    leve: {
        id: 1,
        name: { en: 'Test Leve', 'zh-Hans': 'Test Leve ZH' },
        level: 10,
        jobId: 9,
        issuerName: { en: 'Issuer', 'zh-Hans': 'Issuer ZH' },
        requiredItemId: 100,
        requiredQty: 3,
        turnins: 1,
        rewardGil: 100,
        rewardExp: 1000,
        npcId: 1,
        bonusRewards: []
    },
    item: {
        id: 100,
        name: { en: 'Test Item', 'zh-Hans': 'Test Item ZH' },
        iconUrl: '/item.png',
        canBeHq: true,
        ilvl: 10,
        npcPrice: 10
    },
    // Calculated values
    costNQ: 100,
    revenueNQ: 500,
    profitNQ: 400,
    costHQ: 200,
    revenueHQ: 1000,
    // Missing fields
    marketAnalysis: {
        reliabilityScore: 100,
        isStale: false,
        isOutlier: false,
        isLowSupply: false,
        warnings: []
    },
    totalXPNQ: 1000,
    totalXPHQ: 1000,
    bonusExpectedValue: 0,
    bonusBreakdown: null,
    netProfitNQ: 400,
    netProfitHQ: 800,
    profitHQ: 800,
    optimalQuality: 'HQ',
    optimalProfit: 800,
    optimalCost: 200,
    optimalXP: 1000,
    isStale: false,
    isUnavailable: false,
    freshnessStatus: 'fresh',
    market: {
        itemId: 100,
        datacenter: 'North-America',
        minPriceNQ: 100,
        averagePriceNQ: 120,
        worldNQ: 'Siren',
        minPriceHQ: 200,
        averagePriceHQ: 220,
        worldHQ: 'Siren',
        lastUpdated: new Date().toISOString(),
        listingsCount: 5,
        regularSaleVelocity: 1,
        unitsForSale: 10
    }
};

// Component to test the hook interaction
const TestComponent = () => {
    const { overrides, setOverride } = usePriceOverrides();
    return (
        <div>
            <span data-testid="override-value">{overrides[100] || 'none'}</span>
            <button onClick={() => setOverride(100, 999)}>Set Override</button>
        </div>
    );
};

describe('Price Override Integration', () => {
    it('updates context when override is set', () => {
        render(
            <PriceOverrideProvider>
                <TestComponent />
            </PriceOverrideProvider>
        );

        expect(screen.getByTestId('override-value')).toHaveTextContent('none');

        fireEvent.click(screen.getByText('Set Override'));

        expect(screen.getByTestId('override-value')).toHaveTextContent('999');
    });

    // Integration with Dialog would require rendering the Dialog passing `mockCalculation`
    // and verifying that inputs update the context.
    // However, LeveDetailDialog implementation of inputs needs to be checked.
    // Assuming LeveDetailDialog allows editing costs.
});

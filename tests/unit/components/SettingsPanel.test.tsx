
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsPanel } from '@/components/feature/SettingsPanel';
import { vi, describe, it, expect } from 'vitest';

// Mock the SettingsContext
const mockUpdatePreferences = vi.fn();
const mockPreferences = {
    mode: 'profit',
    selectedJobProfit: [],
    datacenter: 'North-America',
    jobLevels: {},
    setupCompleted: true,
    levelingJobId: null
};



vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'en'
}));

vi.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'light', setTheme: vi.fn() })
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '/en'
}));

vi.mock('@/lib/context/SettingsContext', () => ({
    useSettings: () => ({
        preferences: {
            mode: 'profit',
            jobLevels: { CRP: 100 },
            levelingJobId: 'CRP',
            datacenter: 'TestDC',
            language: 'en',
            theme: 'dark',
            selectedJobProfit: []
        },
        updatePreferences: vi.fn()
    })
}));

describe('SettingsPanel Component', () => {
    it('renders the settings trigger button', () => {
        render(<SettingsPanel />);
        // Expect "title" because mock returns key
        expect(screen.getByRole('button', { name: 'title' })).toBeInTheDocument();
    });

    it('opens the sheet and displays settings', () => {
        render(<SettingsPanel />);
        const trigger = screen.getByRole('button', { name: 'title' });
        fireEvent.click(trigger);

        expect(screen.getByText('appSettings')).toBeInTheDocument();
        expect(screen.getByText('datacenterLabel')).toBeInTheDocument();
        // Check for specific settings content
    });
});

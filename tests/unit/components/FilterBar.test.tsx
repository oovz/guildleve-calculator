
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterBar, FilterBarProps } from '@/components/feature/FilterBar';
import { vi, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'en'
}));

const defaultProps: FilterBarProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    mode: 'profit',
    onModeChange: vi.fn(),
    minLevel: 1,
    onMinLevelChange: vi.fn(),
    maxLevel: 100,
    onMaxLevelChange: vi.fn(),
    levelingJobId: null,
    onLevelingJobChange: vi.fn(),
    currentLevel: 1,
    onCurrentLevelChange: vi.fn(),
    children: null,
};

describe('FilterBar Component', () => {
    it('renders correctly in Profit mode', () => {
        render(<FilterBar {...defaultProps} mode="profit" />);

        expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
        expect(screen.getByLabelText('minLevel')).toBeInTheDocument();
        expect(screen.getByLabelText('maxLevel')).toBeInTheDocument();
        expect(screen.queryByText('jobLabel')).not.toBeInTheDocument();
    });

    it('renders correctly in Leveling mode', () => {
        render(<FilterBar {...defaultProps} mode="leveling" />);

        expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
        expect(screen.queryByLabelText('minLevel')).not.toBeInTheDocument();
        // Select trigger is not an input, but label should be there
        expect(screen.getByText('modeLeveling')).toBeInTheDocument();
        expect(screen.getByText('jobLabel')).toBeInTheDocument();
        expect(screen.getByLabelText('myLevel')).toBeInTheDocument();
    });

    it('calls onSearchChange when typing', () => {
        const onSearchChange = vi.fn();
        render(<FilterBar {...defaultProps} onSearchChange={onSearchChange} />);

        const input = screen.getByPlaceholderText('searchPlaceholder');
        fireEvent.change(input, { target: { value: 'test' } });

        expect(onSearchChange).toHaveBeenCalledWith('test');
    });

    it('calls onModeChange when clicking mode buttons', () => {
        const onModeChange = vi.fn();
        render(<FilterBar {...defaultProps} onModeChange={onModeChange} />);

        const levelingBtn = screen.getByRole('button', { name: 'modeLeveling' });
        fireEvent.click(levelingBtn);

        expect(onModeChange).toHaveBeenCalledWith('leveling');
    });

    it('calls onMinLevelChange and onMaxLevelChange', () => {
        const onMinLevelChange = vi.fn();
        const onMaxLevelChange = vi.fn();
        render(<FilterBar {...defaultProps} onMinLevelChange={onMinLevelChange} onMaxLevelChange={onMaxLevelChange} />);

        const minInput = screen.getByLabelText('minLevel');
        fireEvent.change(minInput, { target: { value: '10' } });
        expect(onMinLevelChange).toHaveBeenCalledWith(10);

        const maxInput = screen.getByLabelText('maxLevel');
        fireEvent.change(maxInput, { target: { value: '90' } });
        expect(onMaxLevelChange).toHaveBeenCalledWith(90);
    });
});

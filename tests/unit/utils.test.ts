import { describe, it, expect } from 'vitest';
import { formatGil, getRelativeTime } from '../../src/lib/utils';

describe('formatGil', () => {
    it('formats positive numbers with comma separators', () => {
        expect(formatGil(1000)).toBe('1,000');
        expect(formatGil(1234567)).toBe('1,234,567');
    });

    it('handles zero', () => {
        expect(formatGil(0)).toBe('0');
    });

    it('handles null and undefined', () => {
        expect(formatGil(null)).toBe('0');
        expect(formatGil(undefined)).toBe('0');
    });

    it('floors decimal values', () => {
        expect(formatGil(1234.99)).toBe('1,234');
        expect(formatGil(1234.01)).toBe('1,234');
        expect(formatGil(123.45)).toBe('123');
    });

    it('formats negative numbers', () => {
        expect(formatGil(-1000)).toBe('-1,000');
    });
});

describe('getRelativeTime', () => {
    it('returns minutes for recent timestamps', () => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        expect(getRelativeTime(fiveMinutesAgo)).toBe('5 mins ago');
    });

    it('returns hours for older timestamps', () => {
        const now = new Date();
        const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
        expect(getRelativeTime(fiveHoursAgo)).toBe('5 hours ago');
    });

    it('returns days for very old timestamps', () => {
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        expect(getRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('handles ISO string input', () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        expect(getRelativeTime(oneHourAgo.toISOString())).toBe('1 hours ago');
    });
});

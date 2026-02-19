import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../src/lib/format';

describe('formatCurrency', () => {
    it('formats numbers with commas', () => {
        const result = formatCurrency(1234);
        // Depending on locale node environment, it might verify '1,234'
        expect(result).toMatch(/1,234/);
    });
});

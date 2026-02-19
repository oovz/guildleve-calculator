export function formatCurrency(amount: number, locale: string = 'en'): string {
    // FFXIV uses Gil, usually just formatted number. But we can use JPY as proxy or just decimal
    // Use 'en-US' or locale.
    return new Intl.NumberFormat(locale, {
        style: 'decimal',
        maximumFractionDigits: 0
    }).format(amount);
}

export function formatXP(amount: number, locale: string = 'en'): string {
    return new Intl.NumberFormat(locale).format(amount);
}

/**
 * Format efficiency (Gil per XP) - negative means profit, positive means cost
 * @param efficiency Gil per XP value
 * @param locale Locale for number formatting
 * @returns Formatted string like "-0.07 Gil/XP" or "+2.5 Gil/XP"
 */
export function formatEfficiency(efficiency: number, locale: string = 'en'): string {
    // const sign = efficiency < 0 ? '' : '+'; // Negative is good (profit), no extra symbol needed
    const formatted = new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'exceptZero'
    }).format(efficiency);
    return `${formatted} Gil/XP`;
}

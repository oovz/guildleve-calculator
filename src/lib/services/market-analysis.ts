import { MarketListing } from '@/types/item';

export interface MarketAnalysisResult {
    reliabilityScore: number; // 0 to 100
    isStale: boolean;
    isOutlier: boolean; // Current price is suspicious compared to history
    isLowSupply: boolean; // Critical stock shortage
    isUntrustworthy?: boolean; // General red flag
    isLowVolume: boolean; // Low sale velocity
    recommendedPrice: number;
    warnings: string[];
}

import { UserPreferences } from '@/types/user-preferences';

/**
 * analyzes market listing for reliability issues and calculates a realistic price
 */
export function analyzeMarketData(
    listing: MarketListing | null,
    quantityNeeded: number = 3,
    preferHQ: boolean = false,
    useForSelling: boolean = false,
    settings?: UserPreferences
): MarketAnalysisResult {
    // Constants per user request (In-game tax is fixed 5% for buyers)
    const TAX_RATE = 0.05;

    // Profile-specific defaults
    const profile = settings?.marketProfile || 'balanced';

    let defaultStaleHours = 24;
    let defaultOutlierThreshold = 0.4;
    let defaultLowVolumeThreshold = 1.0;
    let defaultMinListings = 5;
    let defaultUseHistory = true;

    if (profile === 'edge') {
        defaultStaleHours = 72; // Very lenient
        defaultOutlierThreshold = 0.0; // No defense
        defaultLowVolumeThreshold = 0.0;
        defaultMinListings = 1;
        defaultUseHistory = false;
    } else if (profile === 'strict') {
        defaultStaleHours = 12; // Must be fresh
        defaultOutlierThreshold = 0.6; // More sensitive to low price bait
        defaultLowVolumeThreshold = 2.0; // Higher volume required
        defaultMinListings = 8;
        defaultUseHistory = true;
    }

    // Settings override profile defaults
    const staleHours = settings?.maxStaleHours ?? defaultStaleHours;
    const outlierThreshold = settings?.outlierThreshold ?? defaultOutlierThreshold;
    const lowVolumeThreshold = settings?.lowVolumeThreshold ?? defaultLowVolumeThreshold;
    const minListings = settings?.minListings ?? defaultMinListings;
    const useHistory = settings?.useHistoryVerification ?? defaultUseHistory;

    if (!listing) {
        return {
            reliabilityScore: 0,
            isStale: true,
            isOutlier: false,
            isLowSupply: true,
            isUntrustworthy: true,
            isLowVolume: true,
            recommendedPrice: 0,
            warnings: ['No market data available']
        };
    }

    const warnings: string[] = [];
    let score = 100;

    // 1. Data Context
    const minPrice = preferHQ ? (listing.minPriceHQ ?? listing.minPriceNQ) : listing.minPriceNQ;
    const medianPrice = preferHQ ? (listing.medianPriceHQ ?? listing.medianPriceNQ) : listing.medianPriceNQ;
    const avgPrice = preferHQ ? (listing.averagePriceHQ ?? listing.averagePriceNQ) : listing.averagePriceNQ;

    // 2. Stale Check
    const lastUpdated = new Date(listing.lastUpdated);
    const now = new Date();
    const ageHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    const isStale = ageHours > staleHours;
    if (isStale) {
        score -= 20;
        warnings.push(`Data is ${Math.round(ageHours)} hours old`);
    }

    // 3. Supply Check
    const supply = listing.unitsForSale || 0;
    const isCriticalSupply = supply < quantityNeeded;
    const isLowSupply = supply < (quantityNeeded * 3);

    if (isCriticalSupply) {
        score -= 40;
        warnings.push(`Critical Shortage: Only ${supply} available (need ${quantityNeeded})`);
    } else if (isLowSupply) {
        score -= 10;
    }

    // 4. Volume Check (Velocity)
    const velocity = listing.regularSaleVelocity || 0;
    const isLowVolume = velocity < lowVolumeThreshold;
    if (isLowVolume) {
        score -= 15;
        warnings.push(`Low Volume: Only ${velocity.toFixed(1)} sales/day`);
    }

    // 5. Outlier/Manipulation Check using Median History
    let isOutlier = false;

    // Determine the most relevant base price
    // Buyers: If we are buying, we MUST have an active listing (minPrice), unless user allowed fallback
    // Sellers: If we are selling, we can fallback to history/average for estimation, unless user disabled it
    const allowFallback = useForSelling
        ? (settings?.allowSellerHistoryFallback !== false) // Default true
        : (settings?.allowBuyerHistoryFallback === true);  // Default false

    let basePrice = 0;
    if (allowFallback) {
        basePrice = minPrice || medianPrice || avgPrice || 0;
    } else {
        basePrice = minPrice || 0;
    }

    if (useHistory && minPrice && medianPrice) {
        // BAIT DETECTION: Price is too low compared to history
        if (minPrice < medianPrice * outlierThreshold) {
            isOutlier = true;
            score -= 30;
            warnings.push(`Price bait detected? Min (${minPrice}) is <${Math.round(outlierThreshold * 100)}% of history median (${medianPrice})`);
            // Only fallback to median if it's actually safer/relevant and allowed by settings
            if (allowFallback && (medianPrice > 0)) {
                basePrice = medianPrice;
            }
        }
        // PRICE SPIKE / MANIPULATION: Price is too high
        else if (minPrice > medianPrice * 2.5) {
            isOutlier = true;
            score -= 20;
            warnings.push(`Market reset/shortage? Min (${minPrice}) is >2.5x of history median (${medianPrice})`);
        }
    }

    // 6. Final Reliability
    const listingsCount = listing.listingsCount || 0;
    const ageDays = ageHours / 24;

    // Critical: If we have 0 base price, it's definitely untrustworthy (either no listing or no history allowed)
    const hasZeroPriceBug = (basePrice === 0 || (minPrice === 0 && !allowFallback));

    const isUntrustworthy = listingsCount < minListings || ageDays > 14 || score < 20 || hasZeroPriceBug;

    if (isUntrustworthy) {
        warnings.push('Untrustworthy: Insufficient or extremely stale data');
        if (hasZeroPriceBug) warnings.push('No usable price data found for the requested quality');
    }

    // 7. TAX CALCULATION
    let recommendedPrice = basePrice;

    // Logic: 
    // If we are using the 'minPrice' (meaning it's NOT an outlier), we can use the ACTUAL tax from that listing.
    // If we are using the 'medianPrice' (because minPrice was bait), we MUST estimate the tax.
    // Why? History entries in Universalis don't include tax data.
    const actualTax = preferHQ ? listing.minPriceHQTax : listing.minPriceNQTax;
    const canUseActualTax = !isOutlier && basePrice === minPrice && actualTax !== undefined && actualTax !== null;

    if (useForSelling) {
        // For selling, we assume the user pays the standard retainer fee (usually equal to the city tax the buyer sees)
        recommendedPrice = basePrice * (1 - TAX_RATE);
    } else {
        if (canUseActualTax) {
            recommendedPrice = basePrice + actualTax;
        } else {
            recommendedPrice = basePrice * (1 + TAX_RATE);
        }
    }


    return {
        reliabilityScore: Math.max(0, score),
        isStale,
        isOutlier,
        isLowSupply: isLowSupply || isCriticalSupply,
        isUntrustworthy,
        isLowVolume,
        recommendedPrice,
        warnings
    };
}

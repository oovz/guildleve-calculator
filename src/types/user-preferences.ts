import { JobId } from './job';

export interface JobProfile {
    // Jobs the user has at max level
    maxLevelJobs: JobId[];
}

export type CalculationMode = 'profit' | 'leveling';

export interface UserPreferences {
    mode: CalculationMode;
    // jobLevels: Record<JobId, number>; // 1-100 per job
    jobLevels: Record<string, number>; // Use string to avoid key issues in record
    levelingJobId: JobId | null;
    datacenter: string;
    setupCompleted: boolean;
    selectedJobProfit: JobId[];
    selectedJobLeveling: JobId | null;
    language: 'en' | 'zh-Hans';
    theme: 'light' | 'dark' | 'system';

    // Market Data Settings
    minListings?: number; // Default 5
    maxStaleHours?: number; // Default 24
    useHistoryVerification?: boolean; // Default true
    outlierThreshold?: number; // Default 0.4 (40% of median)
    lowVolumeThreshold?: number; // Default 1.0 (sales per day)
    allowBuyerHistoryFallback?: boolean; // Default false
    allowSellerHistoryFallback?: boolean; // Default true


    // Currency Conversion Rates (Gil per 1 unit)
    currencyRates?: {
        seals: number;
        scrips: number;
        gemstones: number;
    };

    sourcePreference?: 'optimal' | 'npc' | 'market';
    marketProfile?: 'edge' | 'balanced' | 'strict';
}


export interface PriceOverrides {
    [itemId: number]: number;
}

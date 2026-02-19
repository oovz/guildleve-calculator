'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorageService } from '@/lib/storage';
import { UserPreferences } from '@/types/user-preferences';
import { JobId, JOBS } from '@/types/job';

const STORAGE_KEY = 'user-preferences-v1';

const DEFAULT_PREFERENCES: UserPreferences = {
    mode: 'profit',
    jobLevels: {
        CRP: 100, BSM: 100, ARM: 100, GSM: 100,
        LTW: 100, WVR: 100, ALC: 100, CUL: 100
    },
    levelingJobId: 'CRP',
    datacenter: '', // Empty means we will determine it based on language if no stored value
    setupCompleted: true,
    selectedJobProfit: Object.keys(JOBS) as JobId[],
    selectedJobLeveling: null,
    language: 'en',
    theme: 'system',
    currencyRates: {
        seals: 2.0,
        scrips: 1.5,
        gemstones: 50.0
    },
    sourcePreference: 'optimal',
    marketProfile: 'balanced',
    useHistoryVerification: true,
    outlierThreshold: 0.4,
    lowVolumeThreshold: 1.0,
    maxStaleHours: 24,
    minListings: 5,
    allowBuyerHistoryFallback: false,
    allowSellerHistoryFallback: true
};



const getLanguageDefaultDC = (lang: string) => {
    return lang === 'zh-Hans' ? '猫小胖' : 'Primal';
};

interface SettingsContextType {
    preferences: UserPreferences;
    updatePreferences: (updates: Partial<UserPreferences>) => void;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const stored = await StorageService.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);

            // 1. Determine Language defaults if not stored
            let finalLang = stored?.language;
            if (!finalLang) {
                // Try to detect browser locale
                try {
                    const navLang = navigator.language.toLowerCase();
                    if (navLang.startsWith('zh')) {
                        finalLang = 'zh-Hans';
                    } else {
                        finalLang = 'en';
                    }
                } catch {
                    finalLang = 'en';
                }
            }

            // 2. Determine Datacenter defaults if not stored
            let finalDC = stored?.datacenter || '';
            if (!finalDC) {
                finalDC = getLanguageDefaultDC(finalLang);
            }

            // 3. Merge
            const finalPrefs = {
                ...DEFAULT_PREFERENCES,
                ...stored, // Overwrite with stored values
                datacenter: finalDC,
                language: finalLang
            };

            // Ensure stored object actually has these keys if they were missing
            if (!stored?.datacenter || !stored?.language) {
                StorageService.set(STORAGE_KEY, finalPrefs);
            }

            setPreferences(finalPrefs);
            setIsLoading(false);
        };
        load();
    }, []);

    const updatePreferences = (updates: Partial<UserPreferences>) => {
        setPreferences(prev => {
            const next = { ...prev, ...updates };
            // Fire and forget save
            StorageService.set(STORAGE_KEY, next);
            return next;
        });
    };

    return (
        <SettingsContext.Provider value={{ preferences, updatePreferences, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

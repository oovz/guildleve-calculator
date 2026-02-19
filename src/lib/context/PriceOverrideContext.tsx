
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { StorageService } from '@/lib/storage';

const STORAGE_KEY = 'price-overrides';

export type PriceOverrides = Record<number, number>;

interface PriceOverrideContextType {
    overrides: PriceOverrides;
    setOverride: (itemId: number, price: number) => void;
    clearOverride: (itemId: number) => void;
    clearAllOverrides: () => void;
    isLoading: boolean;
}

const PriceOverrideContext = createContext<PriceOverrideContextType | undefined>(undefined);

export function PriceOverrideProvider({ children }: { children: React.ReactNode }) {
    const [overrides, setOverrides] = useState<PriceOverrides>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const stored = await StorageService.get<PriceOverrides>(STORAGE_KEY, {});
            setOverrides(stored);
            setIsLoading(false);
        };
        load();
    }, []);



    const setOverride = useCallback((itemId: number, price: number) => {
        setOverrides(prev => {
            const next = { ...prev, [itemId]: price };
            StorageService.set(STORAGE_KEY, next);
            return next;
        });
    }, []);

    const clearOverride = useCallback((itemId: number) => {
        setOverrides(prev => {
            const next = { ...prev };
            delete next[itemId];
            StorageService.set(STORAGE_KEY, next);
            return next;
        });
    }, []);

    const clearAllOverrides = useCallback(() => {
        setOverrides({});
        StorageService.remove(STORAGE_KEY);
    }, []);

    return (
        <PriceOverrideContext.Provider value={{ overrides, setOverride, clearOverride, clearAllOverrides, isLoading }}>
            {children}
        </PriceOverrideContext.Provider>
    );
}

export function usePriceOverrides() {
    const context = useContext(PriceOverrideContext);
    if (context === undefined) {
        throw new Error('usePriceOverrides must be used within a PriceOverrideProvider');
    }
    return context;
}

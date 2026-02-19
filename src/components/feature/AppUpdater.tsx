
'use client';

import { useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { toast } from 'sonner';

const VERSION_File = '/version.json';
const STORAGE_KEY = 'app-version';

export function AppUpdater() {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Fetch current deployed version
                const response = await fetch(VERSION_File);
                if (!response.ok) return;

                const data = await response.json();
                const currentVersion = data.version;

                // Get stored version
                const storedVersion = localStorage.getItem(STORAGE_KEY);

                // If versions differ
                if (storedVersion && storedVersion !== currentVersion) {
                    console.log(`App updated from ${storedVersion} to ${currentVersion}. Clearing cache...`);

                    // Clear IndexedDB cache (UserPreferences, MarketData)
                    await StorageService.clear();

                    // Update version in localStorage
                    localStorage.setItem(STORAGE_KEY, currentVersion);

                    // Notify user and reload to apply clean state
                    toast.info('Application updated to new version. Reloading...', {
                        duration: 5000,
                    });

                    // Reload to ensure all code chunks are fresh
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);

                } else if (!storedVersion) {
                    // First time visit or cache cleared
                    localStorage.setItem(STORAGE_KEY, currentVersion);
                }
            } catch (error) {
                console.error('Failed to check app version:', error);
            }
        };

        checkVersion();
    }, []);

    return null; // Renderless component
}

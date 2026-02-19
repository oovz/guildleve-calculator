import { get, set, del, clear, createStore } from 'idb-keyval';

// Create a custom store with explicit names to avoid conflicts
// Ref: https://github.com/jakearchibald/idb-keyval#custom-stores
const customStore = createStore('guildleve-db', 'preferences');

/**
 * Wrapper for IndexedDB storage using idb-keyval.
 * Provides async persistence for large datasets (MarketCache) and user settings.
 */
export const StorageService = {
    async get<T>(key: string, defaultValue: T): Promise<T> {
        try {
            const val = await get<T>(key, customStore);
            return val === undefined ? defaultValue : val;
        } catch (error) {
            console.error(`Error reading from storage key "${key}":`, error);
            return defaultValue;
        }
    },

    async set<T>(key: string, value: T): Promise<void> {
        try {
            await set(key, value, customStore);
        } catch (error) {
            console.error(`Error writing to storage key "${key}":`, error);
        }
    },

    async remove(key: string): Promise<void> {
        try {
            await del(key, customStore);
        } catch (error) {
            console.error(`Error removing storage key "${key}":`, error);
        }
    },

    async clear(): Promise<void> {
        try {
            await clear(customStore);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
};


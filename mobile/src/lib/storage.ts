import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A robust storage wrapper that handles cases where AsyncStorage might be unavailable
 * or failing (e.g., "Native module is null" in some environments).
 */
const memoryStorage: Record<string, string> = {};

export const supabaseStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
            return memoryStorage[key] || null;
        }

        try {
            const value = await AsyncStorage.getItem(key);
            return value;
        } catch (error) {
            console.warn('supabaseStorage.getItem error (falling back to memory):', error);
            return memoryStorage[key] || null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
            } else {
                memoryStorage[key] = value;
            }
            return;
        }

        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.warn('supabaseStorage.setItem error (falling back to memory):', error);
            memoryStorage[key] = value;
        }
    },
    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            } else {
                delete memoryStorage[key];
            }
            return;
        }

        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.warn('supabaseStorage.removeItem error (falling back to memory):', error);
            delete memoryStorage[key];
        }
    },
};

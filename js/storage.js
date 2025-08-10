/**
 * Provides a secure storage interface.
 * For now, it's a wrapper around localStorage.
 * In the future, this module will handle encryption and decryption of sensitive data.
 */

const KEY_PREFIX = 'pwa_sheets_';

export const secureStorage = {
    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            // TODO: Encrypt serializedValue before storing
            localStorage.setItem(KEY_PREFIX + key, serializedValue);
        } catch (e) {
            console.error("Failed to save to storage", e);
        }
    },

    getItem(key) {
        try {
            const storedValue = localStorage.getItem(KEY_PREFIX + key);
            if (storedValue === null) {
                return null;
            }
            // TODO: Decrypt storedValue before parsing
            return JSON.parse(storedValue);
        } catch (e) {
            console.error("Failed to retrieve from storage", e);
            return null;
        }
    },

    removeItem(key) {
        localStorage.removeItem(KEY_PREFIX + key);
    }
};

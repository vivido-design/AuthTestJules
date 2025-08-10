/**
 * Manages application configuration, including default and user-provided API keys.
 */

import { secureStorage } from './storage.js';

// Default values - the user can override these.
const DEFAULT_CLIENT_ID = '605518504808-fl0ft2r9htmd0mds85h4jo2hp7ase48q.apps.googleusercontent.com';
const DEFAULT_API_KEY = ''; // It's better to not have a default API key.

export const CONFIG = {
    get GOOGLE_CLIENT_ID() {
        return secureStorage.getItem('user_google_client_id') || DEFAULT_CLIENT_ID;
    },
    get GOOGLE_API_KEY() {
        return secureStorage.getItem('user_google_api_key') || DEFAULT_API_KEY;
    },
    set userGoogleClientId(id) {
        secureStorage.setItem('user_google_client_id', id);
    },
    set userGoogleApiKey(key) {
        secureStorage.setItem('user_google_api_key', key);
    }
};

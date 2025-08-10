/**
 * Manages application configuration, including default and user-provided API keys.
 */

import { secureStorage } from './storage.js';

// Default values - the user can override these.
const DEFAULT_CLIENT_ID = '605518504808-fl0ft2r9htmd0mds85h4jo2hp7ase48q.apps.googleusercontent.com';

export const CONFIG = {
    get GOOGLE_CLIENT_ID() {
        return secureStorage.getItem('user_google_client_id') || DEFAULT_CLIENT_ID;
    },
    set userGoogleClientId(id) {
        secureStorage.setItem('user_google_client_id', id);
    }
};

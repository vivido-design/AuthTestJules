/**
 * Manages application configuration, including the user-provided Client ID.
 * This module uses the async secureStorage module.
 */

import { secureStorage } from './storage.js';

const DEFAULT_CLIENT_ID = '605518504808-fl0ft2r9htmd0mds85h4jo2hp7ase48q.apps.googleusercontent.com';

/**
 * Gets the Google Client ID. It will use the user-provided one from secure storage,
 * or fall back to the default.
 * @returns {Promise<string>}
 */
export async function getClientId() {
    const userClientId = await secureStorage.getItem('user_google_client_id');
    return userClientId || DEFAULT_CLIENT_ID;
}

/**
 * Saves the user's custom Google Client ID to secure storage.
 * @param {string} id The client ID to save.
 */
export async function setClientId(id) {
    await secureStorage.setItem('user_google_client_id', id);
}

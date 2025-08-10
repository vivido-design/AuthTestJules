/**
 * Handles all authentication-related logic using Google Identity Services (GIS).
 */

import { CONFIG } from './config.js';
import { state } from './state.js';

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiLoaded = false;
let gsiLoaded = false;

/**
 * Waits for the Google API (gapi) and Google Sign-In (gsi) scripts to load.
 */
function checkGoogleLibraries() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            gapiLoaded = gapiLoaded || (window.gapi && window.gapi.client);
            gsiLoaded = gsiLoaded || (window.google && window.google.accounts);
            if (gapiLoaded && gsiLoaded) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

/**
 * Callback for the GIS token client. Handles the response.
 */
async function handleTokenResponse(response) {
    if (response.error) {
        console.error("Token error:", response.error);
        state.error = `Error getting access token: ${response.error}`;
        return;
    }
    state.isLoading = true;
    try {
        await fetchUserProfile();
    } catch (error) {
        console.error("Error fetching user profile:", error);
        state.error = "Failed to fetch user profile.";
    } finally {
        state.isLoading = false;
    }
}

/**
 * Fetches the user's profile using the access token.
 */
async function fetchUserProfile() {
    try {
        const response = await gapi.client.request({
            'path': 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        const user = JSON.parse(response.body);
        state.user = {
            name: user.name,
            email: user.email,
            picture: user.picture
        };
        state.isAuthenticated = true;
    } catch (e) {
        console.error("Error fetching user info:", e);
        // Maybe the token is invalid, sign out
        signOut();
        throw new Error("Failed to fetch user info.");
    }
}

/**
 * Initializes the Google Identity Services token client.
 */
function initializeTokenClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
    });
}

/**
 * Handles the sign-in button click.
 */
export function handleSignIn() {
    if (!tokenClient) {
        console.error("Token client not initialized.");
        state.error = "Authentication service is not ready. Please try again in a moment.";
        return;
    }
    // Prompt the user to select an account and grant access
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * Signs the user out, revokes the token, and clears state.
 */
export function signOut() {
    const accessToken = gapi.client.getToken();
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken.access_token, () => {
            console.log('Access token revoked.');
        });
        gapi.client.setToken(null);
    }
    state.user = null;
    state.isAuthenticated = false;
}

/**
 * Main entry point for the auth module.
 */
export async function initializeAuth() {
    await checkGoogleLibraries();
    console.log("Google libraries loaded.");

    // Load the GAPI client and discovery documents for Sheets and Drive APIs
    await new Promise((resolve, reject) => gapi.load('client', {callback: resolve, onerror: reject}));
    await gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4');
    await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');

    initializeTokenClient();

    console.log("Auth module initialized.");
}

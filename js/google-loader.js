/**
 * Dynamically loads the Google API and Google Identity Services scripts.
 * This approach is more robust than polling and works well with ES modules.
 */

const GAPI_URL = 'https://apis.google.com/js/api.js';
const GSI_URL = 'https://accounts.google.com/gsi/client';

let googleApisPromise = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

export function loadGoogleApis() {
    if (!googleApisPromise) {
        googleApisPromise = Promise.all([
            loadScript(GAPI_URL),
            loadScript(GSI_URL)
        ]).then(() => {
            console.log("Google API and GSI scripts loaded successfully.");
        }).catch(error => {
            console.error(error);
            // Reset the promise on failure to allow retries
            googleApisPromise = null;
            throw error;
        });
    }
    return googleApisPromise;
}

/**
 * Main application entry point.
 * This script orchestrates the entire application, initializing modules and handling top-level logic.
 */

import { initializeAuth } from './auth.js';
import { initializeUi } from './ui.js';

// Main function to initialize the application
function main() {
    console.log("PWA Initializing...");
    initializeUi();
    initializeAuth();
    // More initialization logic will be added here.
}

// Register the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Run the main application logic when the DOM is ready
document.addEventListener('DOMContentLoaded', main);

/**
 * Main application entry point.
 * This script orchestrates the entire application, initializing modules and handling top-level logic.
 */

import { initializeAuth } from './auth.js';
import { initializeUi } from './ui.js';

// Main function to initialize the application
async function main() {
    console.log("PWA Initializing...");
    try {
        initializeUi();
        await initializeAuth();
        console.log("Application fully initialized.");
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        // Here you could show a global error message to the user
        const statusContainer = document.getElementById('status-container');
        if (statusContainer) {
            statusContainer.innerHTML = '<p style="color: red;">Application failed to load. Please try again later.</p>';
        }
    }
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

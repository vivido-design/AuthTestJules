/**
 * Manages the global state of the application.
 * This includes authentication status, current user, loaded sheets, etc.
 * It provides a single source of truth and helps to avoid state-related bugs.
 */

const appState = {
    isAuthenticated: false,
    user: null, // { name, email, picture }
    currentSheetId: null,
    isLoading: false,
    error: null,
    // more state properties will be added here
};

// Simple state management with listeners for reactivity
const listeners = [];

export const state = new Proxy(appState, {
    set(target, property, value) {
        target[property] = value;
        // Notify listeners of the change
        listeners.forEach(listener => listener(property, value));
        return true;
    }
});

export function addStateListener(listener) {
    listeners.push(listener);
}

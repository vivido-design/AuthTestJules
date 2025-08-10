/**
 * Handles all DOM manipulations and UI updates.
 * This module keeps the UI logic separate from the business logic.
 */

import { CONFIG } from './config.js';
import { secureStorage } from './storage.js';
import { state, addStateListener } from './state.js';
import { signOut, handleSignIn } from './auth.js';
import { createSheet, getAppCreatedSheets, showPicker } from './api.js';


function showStatusMessage(message, isError = false) {
    const statusContainer = document.getElementById('status-container');
    const statusMessage = document.createElement('p');
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? 'red' : 'green';
    statusContainer.appendChild(statusMessage);
    setTimeout(() => statusMessage.remove(), 5000);
}

function toggleLoading(isLoading) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (isLoading) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

async function refreshTrackedSheets() {
    state.isLoading = true;
    try {
        const sheets = await getAppCreatedSheets();
        state.trackedSheets = sheets || [];
        updateTrackedSheetsUI();
    } catch (error) {
        console.error('Failed to load app-created sheets:', error);
        showStatusMessage('Could not load your sheets. Please check console.', true);
    } finally {
        state.isLoading = false;
    }
}

function updateTrackedSheetsUI() {
    const listEl = document.getElementById('recent-sheets-list');
    const sheets = state.trackedSheets;

    listEl.innerHTML = ''; // Clear the list

    if (sheets && sheets.length > 0) {
        // Sort by modification time descending
        sheets.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

        sheets.forEach(sheet => {
            const li = document.createElement('li');
            // Use textContent for security
            li.textContent = `${sheet.name} (Last modified: ${new Date(sheet.modifiedTime).toLocaleString()})`;
            li.dataset.sheetId = sheet.id;
            listEl.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No tracked sheets. Create one or open one from the picker.';
        listEl.appendChild(li);
    }
}

function updateUiForAuthState(isAuthenticated, user) {
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const userInfo = document.getElementById('user-info');
    const userNameEl = document.getElementById('user-name');
    const userAvatarEl = document.getElementById('user-avatar');

    if (isAuthenticated) {
        authSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        userNameEl.textContent = user.name;
        userAvatarEl.src = user.picture;
    } else {
        authSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
        userInfo.classList.add('hidden');
        userNameEl.textContent = '';
        userAvatarEl.src = '';
    }
}


function initializeApiConfig() {
    const clientIdInput = document.getElementById('google-client-id');
    const saveButton = document.getElementById('save-api-keys-button');
    const statusEl = document.getElementById('api-keys-status');

    // Load saved client id into input field on startup
    const savedClientId = secureStorage.getItem('user_google_client_id');
    if (savedClientId) {
        clientIdInput.value = savedClientId;
    }

    // Handle save button click
    saveButton.addEventListener('click', () => {
        const newClientId = clientIdInput.value.trim();

        if (!newClientId) {
            statusEl.textContent = 'Client ID cannot be empty.';
            statusEl.style.color = 'red';
            return;
        }

        CONFIG.userGoogleClientId = newClientId;

        statusEl.textContent = 'Client ID saved successfully! The app will use the new ID on the next reload.';
        statusEl.style.color = 'green';

        setTimeout(() => {
            statusEl.textContent = '';
        }, 5000);
    });
}

export function initializeUi() {
    console.log("UI module initialized.");

    // Initialize API config section
    initializeApiConfig();

    // Add auth-related event listeners
    const authButton = document.getElementById('auth-button');
    const signOutButton = document.getElementById('sign-out-button');
    const createSheetButton = document.getElementById('create-sheet-button');
    const pickerButton = document.getElementById('load-from-picker-button');

    if (authButton) authButton.addEventListener('click', handleSignIn);
    if (signOutButton) signOutButton.addEventListener('click', signOut);

    if (pickerButton) pickerButton.addEventListener('click', async () => {
        try {
            const token = gapi.client.getToken().access_token;
            const doc = await showPicker(token);
            // Add the picked sheet to our state if it's not already there
            if (!state.trackedSheets.find(s => s.id === doc.id)) {
                // We need more details than the picker provides, so fetch them
                const sheetDetails = { id: doc.id, name: doc.name, modifiedTime: doc.lastEditedUtc, webViewLink: doc.url };
                state.trackedSheets = [...state.trackedSheets, sheetDetails];
                updateTrackedSheetsUI();
            }
            showStatusMessage(`Added "${doc.name}" to tracked sheets.`);
        } catch (error) {
            if (error.message !== "Picker was cancelled.") {
                console.error("Picker Error:", error);
                showStatusMessage(`Could not open picker: ${error.message}`, true);
            }
        }
    });

    if (createSheetButton) createSheetButton.addEventListener('click', async () => {
        const title = prompt("Enter a title for the new sheet:", "PWA New Sheet");
        if (title) {
            state.isLoading = true;
            try {
                const sheet = await createSheet(title);
                showStatusMessage(`Sheet "${sheet.properties.title}" created successfully!`);
                // Add the new sheet to the top of our state and refresh the UI
                state.trackedSheets = [sheet, ...state.trackedSheets];
                updateTrackedSheetsUI();
            } catch (error) {
                console.error("Failed to create sheet:", error);
                showStatusMessage(`Error creating sheet: ${error.message}`, true);
            } finally {
                state.isLoading = false;
            }
        }
    });

    // Set up state listener for auth and loading changes
    addStateListener((property, value) => {
        switch (property) {
            case 'isAuthenticated':
                updateUiForAuthState(value, state.user);
                if (value === true) {
                    // User has just logged in, load their app-created sheets
                    refreshTrackedSheets();
                } else {
                    // User logged out, clear the sheet list
                    state.trackedSheets = [];
                    updateTrackedSheetsUI();
                }
                break;
            case 'isLoading':
                toggleLoading(value);
                break;
        }
    });

    // Initial UI update based on current state
    updateUiForAuthState(state.isAuthenticated, state.user);
    toggleLoading(state.isLoading);
}

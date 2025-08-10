/**
 * Handles all DOM manipulations and UI updates.
 * This module keeps the UI logic separate from the business logic.
 */

import { CONFIG } from './config.js';
import { secureStorage } from './storage.js';
import { state, addStateListener } from './state.js';
import { signOut, handleSignIn } from './auth.js';
import { createSheet, getRecentSheets } from './api.js';


function showStatusMessage(message, isError = false) {
    const statusContainer = document.getElementById('status-container');
    const statusMessage = document.createElement('p');
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? 'red' : 'green';
    statusContainer.appendChild(statusMessage);
    setTimeout(() => statusMessage.remove(), 5000);
}

async function loadAndDisplayRecentSheets() {
    state.isLoading = true;
    const listEl = document.getElementById('recent-sheets-list');
    listEl.innerHTML = '<li>Loading recent sheets...</li>';

    try {
        const sheets = await getRecentSheets();
        if (sheets && sheets.length > 0) {
            listEl.innerHTML = '';
            sheets.forEach(sheet => {
                const li = document.createElement('li');
                li.textContent = `${sheet.name} (Last modified: ${new Date(sheet.modifiedTime).toLocaleString()})`;
                li.dataset.sheetId = sheet.id;
                listEl.appendChild(li);
            });
        } else {
            listEl.innerHTML = '<li>No recent sheets found.</li>';
        }
    } catch (error) {
        console.error('Failed to load recent sheets:', error);
        listEl.innerHTML = '<li>Error loading recent sheets.</li>';
        showStatusMessage('Could not load recent sheets. Please check console.', true);
    } finally {
        state.isLoading = false;
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

    if (authButton) authButton.addEventListener('click', handleSignIn);
    if (signOutButton) signOutButton.addEventListener('click', signOut);
    if (createSheetButton) createSheetButton.addEventListener('click', async () => {
        const title = prompt("Enter a title for the new sheet:", "PWA New Sheet");
        if (title) {
            state.isLoading = true;
            try {
                const sheet = await createSheet(title);
                showStatusMessage(`Sheet "${sheet.properties.title}" created successfully!`);
                await loadAndDisplayRecentSheets(); // Refresh the list
            } catch (error) {
                console.error("Failed to create sheet:", error);
                showStatusMessage(`Error creating sheet: ${error.message}`, true);
            } finally {
                state.isLoading = false;
            }
        }
    });

    // Set up state listener for auth changes
    addStateListener((property, value) => {
        if (property === 'isAuthenticated') {
            updateUiForAuthState(value, state.user);
            if (value === true) {
                // User has just logged in, load their sheets
                loadAndDisplayRecentSheets();
            }
        }
    });

    // Initial UI update based on current state
    updateUiForAuthState(state.isAuthenticated, state.user);
}

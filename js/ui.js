/**
 * Handles all DOM manipulations and UI updates.
 * This module keeps the UI logic separate from the business logic.
 */

import { getClientId, setClientId } from './config.js';
import { state, addStateListener } from './state.js';
import { signOut, handleSignIn } from './auth.js';
import { createSheet, getAppCreatedSheets, showPicker, getSheetData, appendRow } from './api.js';
import { trackSheetView, checkForChanges } from './notifications.js';


function renderSheetData(data) {
    const table = document.getElementById('sheet-data-table');
    table.innerHTML = ''; // Clear previous data

    if (!data || !data.values || data.values.length === 0) {
        table.innerHTML = '<tr><td>No data found in this sheet.</td></tr>';
        return;
    }

    const values = data.values;
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    // Assuming the first row is the header
    const headers = values[0];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    // Starting from the second row for data
    for (let i = 1; i < values.length; i++) {
        const rowData = values[i];
        const tr = document.createElement('tr');
        rowData.forEach(cellData => {
            const td = document.createElement('td');
            td.textContent = cellData;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
}

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
        const sheetsWithNotifications = checkForChanges(sheets);
        state.trackedSheets = sheetsWithNotifications || [];
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
            if (sheet.hasNotification) {
                li.classList.add('has-notification');
            }
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


async function initializeApiConfig() {
    const clientIdInput = document.getElementById('google-client-id');
    const saveButton = document.getElementById('save-api-keys-button');
    const statusEl = document.getElementById('api-keys-status');

    // Load saved client id into input field on startup
    clientIdInput.value = await getClientId();

    // Handle save button click
    saveButton.addEventListener('click', async () => {
        const newClientId = clientIdInput.value.trim();

        if (!newClientId) {
            statusEl.textContent = 'Client ID cannot be empty.';
            statusEl.style.color = 'red';
            return;
        }

        await setClientId(newClientId);

        statusEl.textContent = 'Client ID saved successfully! The app will use the new ID on the next reload.';
        statusEl.style.color = 'green';

        setTimeout(() => {
            statusEl.textContent = '';
        }, 5000);
    });
}

export async function initializeUi() {
    console.log("UI module initialized.");

    // Initialize API config section
    await initializeApiConfig();

    // Add auth-related event listeners
    const authButton = document.getElementById('auth-button');
    const signOutButton = document.getElementById('sign-out-button');
    const createSheetButton = document.getElementById('create-sheet-button');
    const pickerButton = document.getElementById('load-from-picker-button');
    const trackedSheetsList = document.getElementById('recent-sheets-list');
    const addRowButton = document.getElementById('add-row-button');

    if (authButton) authButton.addEventListener('click', handleSignIn);
    if (signOutButton) signOutButton.addEventListener('click', signOut);

    if (trackedSheetsList) trackedSheetsList.addEventListener('click', async (event) => {
        const targetLi = event.target.closest('li');
        if (!targetLi || !targetLi.dataset.sheetId) return;

        const sheetId = targetLi.dataset.sheetId;
        trackSheetView(sheetId); // Mark as viewed
        targetLi.classList.remove('has-notification'); // Immediately remove visual indicator

        state.currentSheetId = sheetId;
        state.isLoading = true;
        document.getElementById('current-sheet-title').textContent = `Loading: ${targetLi.textContent.split('(')[0].trim()}`;

        try {
            const data = await getSheetData(sheetId);
            renderSheetData(data);
            document.getElementById('current-sheet-title').textContent = `Data for: ${targetLi.textContent.split('(')[0].trim()}`;
        } catch (error) {
            console.error(`Failed to get data for sheet ${sheetId}:`, error);
            showStatusMessage(`Could not load data for sheet.`, true);
            document.getElementById('current-sheet-title').textContent = 'Sheet Data';
        } finally {
            state.isLoading = false;
        }
    });

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

    if (addRowButton) addRowButton.addEventListener('click', async () => {
        const sheetId = state.currentSheetId;
        if (!sheetId) {
            showStatusMessage("Please select a sheet first.", true);
            return;
        }
        const input = document.getElementById('new-row-data');
        const values = input.value.split(',').map(v => v.trim());

        if (values.length === 0 || input.value.trim() === '') {
            showStatusMessage("Please enter some data to add.", true);
            return;
        }

        state.isLoading = true;
        try {
            await appendRow(sheetId, values);
            showStatusMessage("Row added successfully!");
            input.value = '';
            // Refresh the data view
            const data = await getSheetData(sheetId);
            renderSheetData(data);
        } catch (error) {
            console.error("Failed to append row:", error);
            showStatusMessage(`Could not add row: ${error.message}`, true);
        } finally {
            state.isLoading = false;
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

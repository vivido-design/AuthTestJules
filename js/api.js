/**
 * Manages all interactions with Google APIs (Sheets, Drive, Picker).
 * This module abstracts the complexity of API calls.
 */

/**
 * Creates a new Google Sheet with a specific title.
 * @param {string} title The title for the new spreadsheet.
 * @returns {Promise<Object>} The spreadsheet resource object from the API.
 */
export async function createSheet(title = 'New PWA Sheet') {
    if (!gapi.client.sheets) {
        throw new Error("Google Sheets API client not loaded.");
    }
    const response = await gapi.client.sheets.spreadsheets.create({
        properties: {
            title: title
        }
    });
    console.log('Created sheet:', response.result);
    return response.result;
}

/**
 * Fetches a list of spreadsheets created by this application.
 * With the 'drive.file' scope, this can only see files created by this app instance.
 * @returns {Promise<Array<Object>>} A list of file resource objects from the Drive API.
 */
export async function getAppCreatedSheets() {
    if (!gapi.client.drive) {
        throw new Error("Google Drive API client not loaded.");
    }
    const response = await gapi.client.drive.files.list({
        pageSize: 15,
        fields: 'files(id, name, modifiedTime, lastModifyingUser, webViewLink)',
        q: 'mimeType="application/vnd.google-apps.spreadsheet" and trashed=false',
        orderBy: 'modifiedTime desc'
    });
    console.log('App-created sheets:', response.result.files);
    return response.result.files;
}

/**
 * Shows the Google Picker UI to allow the user to select a spreadsheet.
 * @param {string} accessToken The user's OAuth 2.0 access token.
 * @returns {Promise<Object>} A promise that resolves with the selected document's metadata.
 */
export function showPicker(accessToken) {
    return new Promise((resolve, reject) => {
        const pickerCallback = (data) => {
            if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                const doc = data[google.picker.Response.DOCUMENTS][0];
                resolve(doc);
            } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
                reject(new Error("Picker was cancelled."));
            }
        };

        const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
            .setMimeTypes("application/vnd.google-apps.spreadsheet")
            .setIncludeFolders(false)
            .setMode(google.picker.DocsViewMode.LIST);

        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .setAppId(CONFIG.GOOGLE_CLIENT_ID.split('-')[0]) // Use the number part of the client ID as App ID
            .setOAuthToken(accessToken)
            .addView(view)
            .setCallback(pickerCallback)
            .build();

        picker.setVisible(true);
    });
}

/**
 * Gets the metadata for a specific spreadsheet.
 * @param {string} sheetId The ID of the spreadsheet.
 * @returns {Promise<Object>} The spreadsheet resource object.
 */
export async function getSheetDetails(sheetId) {
    const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: sheetId
    });
    return response.result;
}

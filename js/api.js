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
 * Fetches a list of the user's most recently modified spreadsheets.
 * @returns {Promise<Array<Object>>} A list of file resource objects from the Drive API.
 */
export async function getRecentSheets() {
    if (!gapi.client.drive) {
        throw new Error("Google Drive API client not loaded.");
    }
    const response = await gapi.client.drive.files.list({
        pageSize: 15,
        fields: 'files(id, name, modifiedTime, lastModifyingUser, webViewLink)',
        q: 'mimeType="application/vnd.google-apps.spreadsheet" and trashed=false',
        orderBy: 'modifiedTime desc'
    });
    console.log('Recent sheets:', response.result.files);
    return response.result.files;
}

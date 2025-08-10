/**
 * Manages the logic for the notification system.
 * This includes tracking when sheets are viewed and checking for modifications.
 */

const VIEW_TIME_PREFIX = 'view_time_';

/**
 * Records the current time as the last time a sheet was viewed.
 * @param {string} sheetId The ID of the sheet being viewed.
 */
export function trackSheetView(sheetId) {
    try {
        localStorage.setItem(VIEW_TIME_PREFIX + sheetId, new Date().toISOString());
    } catch (e) {
        console.error("Failed to save view time to localStorage", e);
    }
}

/**
 * Checks a list of sheets for any modifications since their last view time.
 * @param {Array<Object>} sheets The list of sheet objects from the state.
 * @returns {Array<Object>} The same list of sheets, with an added `hasNotification` property.
 */
export function checkForChanges(sheets) {
    if (!sheets) return [];

    return sheets.map(sheet => {
        try {
            const lastViewed = localStorage.getItem(VIEW_TIME_PREFIX + sheet.id);
            if (!lastViewed) {
                // If never viewed, it's considered "new"
                sheet.hasNotification = true;
            } else {
                const lastViewedTime = new Date(lastViewed);
                const modifiedTime = new Date(sheet.modifiedTime);
                if (modifiedTime > lastViewedTime) {
                    sheet.hasNotification = true;
                } else {
                    sheet.hasNotification = false;
                }
            }
        } catch (e) {
            console.error("Failed to check for notification", e);
            sheet.hasNotification = false;
        }
        return sheet;
    });
}

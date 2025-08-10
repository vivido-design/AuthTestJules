# Google Cloud Project Setup for PWA Google Sheets

This guide will walk you through setting up a Google Cloud project to get the necessary credentials (Client ID and API Key) for the PWA.

## 1. Create a Google Cloud Project

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project drop-down and select **New Project**.
3.  Give your project a name (e.g., "My Sheets PWA") and click **Create**.

## 2. Enable Required APIs

For this application to work, you need to enable three APIs:

1.  In the Cloud Console, navigate to **APIs & Services > Library**.
2.  Search for and enable the following APIs one by one:
    *   **Google Drive API**
    *   **Google Sheets API**
    *   **Google Picker API**

## 3. Create OAuth 2.0 Credentials (Client ID)

This is required for user authentication.

1.  Go to **APIs & Services > Credentials**.
2.  Click **Create Credentials** and select **OAuth client ID**.
3.  If prompted, configure the **OAuth consent screen**.
    *   Select **External** for the User Type.
    *   Fill in the required fields (App name, User support email, Developer contact information).
    *   On the "Scopes" page, you can click "Save and Continue" for now. We will request scopes from the application.
    *   On the "Test users" page, add your Google account(s) that you will use for testing.
4.  Now, back on the Credentials page, create the OAuth client ID:
    *   **Application type:** Select **Web application**.
    *   **Name:** Give it a descriptive name (e.g., "PWA Sheets Web Client").
    *   **Authorized JavaScript origins:** Add the URL where you will host the app (e.g., `https://your-github-username.github.io` or `http://localhost:8080` for local testing).
    *   **Authorized redirect URIs:** This is not strictly required for the Google Identity Services library, but it's good practice to add your app's URL here as well.
5.  Click **Create**. You will be shown your **Client ID**. Copy this value.

## 4. Create an API Key

This is required for certain unauthenticated API calls. The Picker API sometimes needs this.

1.  Go to **APIs & Services > Credentials**.
2.  Click **Create Credentials** and select **API key**.
3.  An API key will be created. Copy this value.
4.  **Important:** It is highly recommended to restrict your API key to prevent unauthorized use. Click on the new API key, and under "API restrictions", select "Restrict key" and choose the three APIs you enabled in step 2.

## 5. Use the Credentials in the App

Once you have your **Client ID** and **API Key**, you can enter them into the application's settings UI to connect the PWA to your own Google Cloud project. This gives you control over your API usage and quotas.

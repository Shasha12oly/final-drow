// Google Sheets Configuration
// Replace these values with your actual Google Sheets API credentials

const GOOGLE_SHEETS_CONFIG = {
    // Get these from Google Cloud Console
    API_KEY: 'AIzaSyDGZf9VD6mjtlj6lAA4F6BPhxEVBS1ag-4',
    CLIENT_ID: '280189100786-8phabqt4mjjo792u7b4bkhf4tg6qn6rj.apps.googleusercontent.com',
    
    // Your Google Spreadsheet ID (or leave empty to create a new one)
    SPREADSHEET_ID: '19aMVOzKfR5uxCxFHob13uIjG30Yfi9n9pX176BKkK9A',
    
    // OAuth Scopes
    SCOPES: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
    
    // Discovery Document
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
    
    // App Name
    APP_NAME: 'Growth Tracker Pro',
    
    // Enable development mode (uses mock data if API is not available)
    DEV_MODE: false
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOOGLE_SHEETS_CONFIG;
} else if (typeof window !== 'undefined') {
    window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG;
}

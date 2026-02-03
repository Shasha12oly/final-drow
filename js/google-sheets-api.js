// Google Sheets API Integration for Growth Tracker
// Replaces IndexedDB with Google Sheets as the database

class GoogleSheetsAPI {
    constructor() {
        this.apiKey = null;
        this.clientId = null;
        this.spreadsheetId = null;
        this.isInitialized = false;
        this.accessToken = null;
        this.tokenClient = null;
        this.gapi = null;
    }

    // Initialize Google Sheets API
    async init(config = {}) {
        try {
            this.apiKey = config.apiKey || 'YOUR_GOOGLE_API_KEY';
            this.clientId = config.clientId || 'YOUR_GOOGLE_CLIENT_ID';
            this.spreadsheetId = config.spreadsheetId || 'YOUR_SPREADSHEET_ID';
            
            // Load Google API client
            await this.loadGoogleAPI();
            
            // Initialize the API client
            await this.gapi.client.init({
                apiKey: this.apiKey,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            
            // Initialize token client
            await this.initTokenClient();
            
            this.isInitialized = true;
            console.log('Google Sheets API initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Google Sheets API:', error);
            throw error;
        }
    }

    // Load Google API client library
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            // Check if gapi is already loaded
            if (window.gapi && window.gapi.client) {
                this.gapi = window.gapi;
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client:auth2', () => {
                    this.gapi = window.gapi;
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Initialize Google Identity Services
    async initTokenClient() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => {
                this.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.clientId,
                    scope: 'https://www.googleapis.com/auth/spreadsheets',
                    callback: (response) => {
                        if (response && response.access_token) {
                            this.accessToken = response.access_token;
                            resolve();
                        } else {
                            reject(new Error('Failed to get access token'));
                        }
                    }
                });
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Authenticate user
    async authenticate() {
        if (!this.isInitialized) {
            throw new Error('Google Sheets API not initialized');
        }

        return new Promise((resolve, reject) => {
            this.tokenClient.requestAccessToken();
            
            // Listen for token response
            window.addEventListener('google-sign-in-token', (event) => {
                if (event.detail) {
                    this.accessToken = event.detail.access_token;
                    resolve(event.detail);
                } else {
                    reject(new Error('Authentication failed'));
                }
            }, { once: true });
        });
    }

    // Sign out user
    signOut() {
        if (this.accessToken) {
            google.accounts.oauth2.revoke(this.accessToken);
            this.accessToken = null;
        }
    }

    // Check if authenticated
    isAuthenticated() {
        return this.accessToken !== null;
    }

    // Create or get spreadsheet
    async getOrCreateSpreadsheet(title = 'Growth Tracker Data') {
        try {
            // First try to get existing spreadsheet
            const spreadsheet = await this.getSpreadsheet();
            if (spreadsheet) {
                return spreadsheet;
            }

            // Create new spreadsheet
            const response = await gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: title
                }
            });

            this.spreadsheetId = response.result.spreadsheetId;
            await this.setupSpreadsheet();
            
            return response.result;
        } catch (error) {
            console.error('Failed to get or create spreadsheet:', error);
            throw error;
        }
    }

    // Get spreadsheet info
    async getSpreadsheet() {
        try {
            const response = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            return response.result;
        } catch (error) {
            console.error('Failed to get spreadsheet:', error);
            return null;
        }
    }

    // Setup spreadsheet with required sheets
    async setupSpreadsheet() {
        try {
            // Create sheets for different data types
            const sheets = [
                { title: 'Users' },
                { title: 'DailyRecords' },
                { title: 'Tasks' },
                { title: 'Habits' },
                { title: 'UserSettings' }
            ];

            for (const sheet of sheets) {
                await this.createSheet(sheet.title);
            }

            // Setup headers for each sheet
            await this.setupSheetHeaders();
            
        } catch (error) {
            console.error('Failed to setup spreadsheet:', error);
            throw error;
        }
    }

    // Create a new sheet
    async createSheet(title) {
        try {
            const response = await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requests: [{
                    addSheet: {
                        properties: {
                            title: title
                        }
                    }
                }]
            });

            return response.result;
        } catch (error) {
            console.error('Failed to create sheet:', error);
            throw error;
        }
    }

    // Setup headers for all sheets
    async setupSheetHeaders() {
        const sheetConfigs = {
            'Users': ['ID', 'Name', 'Email', 'Picture', 'IsGoogleUser', 'CreatedAt', 'UpdatedAt'],
            'DailyRecords': ['ID', 'UserID', 'Date', 'TasksCompleted', 'TasksTotal', 'HabitsCompleted', 'HabitsTotal', 'Productivity', 'Mood', 'Notes', 'TasksSubmitted', 'Physics', 'AdditionalSubjectChemistryMaths', 'Exercise', 'WakeUp', 'ScreenControl', 'ValidDay', 'CreatedAt', 'UpdatedAt'],
            'Tasks': ['ID', 'UserID', 'Title', 'Category', 'Priority', 'Status', 'CompletedAt', 'CreatedAt', 'UpdatedAt'],
            'Habits': ['ID', 'UserID', 'Title', 'Description', 'Category', 'TargetFrequency', 'TargetCount', 'Color', 'Icon', 'IsActive', 'CreatedAt', 'UpdatedAt'],
            'UserSettings': ['ID', 'UserID', 'Theme', 'Notifications', 'Language', 'CreatedAt', 'UpdatedAt']
        };

        for (const [sheetName, headers] of Object.entries(sheetConfigs)) {
            await this.setSheetHeaders(sheetName, headers);
        }
    }

    // Set headers for a specific sheet
    async setSheetHeaders(sheetName, headers) {
        try {
            const sheetId = await this.getSheetId(sheetName);
            
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
                valueRange: [headers],
                valueInputOption: 'USER_ENTERED'
            });

            return response.result;
        } catch (error) {
            console.error('Failed to set sheet headers:', error);
            throw error;
        }
    }

    // Get sheet ID by name
    async getSheetId(sheetName) {
        try {
            const spreadsheet = await this.getSpreadsheet();
            const sheet = spreadsheet.sheets.find(s => s.properties.title === sheetName);
            return sheet ? sheet.properties.sheetId : null;
        } catch (error) {
            console.error('Failed to get sheet ID:', error);
            throw error;
        }
    }

    // Read data from a sheet
    async readData(sheetName, range = 'A:Z') {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${range}`
            });

            return response.result.values || [];
        } catch (error) {
            console.error('Failed to read data:', error);
            return [];
        }
    }

    // Write data to a sheet
    async writeData(sheetName, range, values) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${range}`,
                valueRange: values,
                valueInputOption: 'USER_ENTERED'
            });

            return response.result;
        } catch (error) {
            console.error('Failed to write data:', error);
            throw error;
        }
    }

    // Append data to a sheet
    async appendData(sheetName, values) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`,
                valueRange: values,
                valueInputOption: 'USER_ENTERED'
            });

            return response.result;
        } catch (error) {
            console.error('Failed to append data:', error);
            throw error;
        }
    }

    // Find data in a sheet
    async findData(sheetName, searchColumn, searchValue, returnColumn = null) {
        try {
            const data = await this.readData(sheetName);
            const headerRow = data[0] || [];
            const searchColIndex = headerRow.indexOf(searchColumn);
            const returnColIndex = returnColumn ? headerRow.indexOf(returnColumn) : null;

            if (searchColIndex === -1) {
                throw new Error(`Column '${searchColumn}' not found`);
            }

            const results = [];
            for (let i = 1; i < data.length; i++) {
                if (data[i][searchColIndex] == searchValue) {
                    if (returnColumn && returnColIndex !== -1) {
                        results.push(data[i][returnColIndex]);
                    } else {
                        results.push(data[i]);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Failed to find data:', error);
            return [];
        }
    }

    // Get next available ID from a sheet
    async getNextId(sheetName, idColumn = 'ID') {
        try {
            const data = await this.readData(sheetName);
            const headerRow = data[0] || [];
            const idColIndex = headerRow.indexOf(idColumn);

            if (idColIndex === -1) {
                throw new Error(`Column '${idColumn}' not found`);
            }

            let maxId = 0;
            for (let i = 1; i < data.length; i++) {
                const id = parseInt(data[i][idColIndex]) || 0;
                if (id > maxId) {
                    maxId = id;
                }
            }

            return maxId + 1;
        } catch (error) {
            console.error('Failed to get next ID:', error);
            return 1;
        }
    }

    // Clear a sheet
    async clearSheet(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`
            });

            return response.result;
        } catch (error) {
            console.error('Failed to clear sheet:', error);
            throw error;
        }
    }

    // Format a row as an array
    formatRow(data, headers) {
        return headers.map(header => data[header] || '');
    }

    // Parse a row back to an object
    parseRow(row, headers) {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    }

    // Convert date to string format
    dateToString(date) {
        if (typeof date === 'string') {
            return date;
        }
        return new Date(date).toISOString().split('T')[0];
    }

    // Convert string to date
    stringToDate(dateString) {
        return new Date(dateString + 'T00:00:00');
    }
}

// Make available globally
window.GoogleSheetsAPI = GoogleSheetsAPI;

// Google Sheets Data Manager for Growth Tracker
// Replaces IndexedDB with Google Sheets as the database

class GoogleSheetsDataManager {
    constructor() {
        this.api = new GoogleSheetsAPI();
        this.currentUser = null;
        this.isInitialized = false;
        this.sheetConfigs = {
            users: {
                name: 'Users',
                headers: ['ID', 'Name', 'Email', 'Picture', 'IsGoogleUser', 'CreatedAt', 'UpdatedAt']
            },
            dailyRecords: {
                name: 'DailyRecords',
                headers: ['ID', 'UserID', 'Date', 'TasksCompleted', 'TasksTotal', 'HabitsCompleted', 'HabitsTotal', 'Productivity', 'Mood', 'Notes', 'TasksSubmitted', 'Physics', 'AdditionalSubjectChemistryMaths', 'Exercise', 'WakeUp', 'ScreenControl', 'ValidDay', 'CreatedAt', 'UpdatedAt']
            },
            tasks: {
                name: 'Tasks',
                headers: ['ID', 'UserID', 'Title', 'Category', 'Priority', 'Status', 'CompletedAt', 'CreatedAt', 'UpdatedAt']
            },
            habits: {
                name: 'Habits',
                headers: ['ID', 'UserID', 'Title', 'Description', 'Category', 'TargetFrequency', 'TargetCount', 'Color', 'Icon', 'IsActive', 'CreatedAt', 'UpdatedAt']
            },
            userSettings: {
                name: 'UserSettings',
                headers: ['ID', 'UserID', 'Theme', 'Notifications', 'Language', 'CreatedAt', 'UpdatedAt']
            }
        };
    }

    // Initialize the data manager
    async init(config = {}) {
        try {
            await this.api.init(config);
            await this.api.getOrCreateSpreadsheet('Growth Tracker Data');
            this.isInitialized = true;
            console.log('Google Sheets Data Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Google Sheets Data Manager:', error);
            throw error;
        }
    }

    // Ensure the data manager is initialized
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Google Sheets Data Manager not initialized');
        }
    }

    // Set current user
    async setCurrentUser(user) {
        this.ensureInitialized();
        
        try {
            // Check if user already exists
            const existingUsers = await this.api.findData('Users', 'Email', user.email);
            
            if (existingUsers.length === 0) {
                // Create new user
                const nextId = await this.api.getNextId('Users');
                const userData = {
                    ID: nextId.toString(),
                    Name: user.name,
                    Email: user.email,
                    Picture: user.picture || '',
                    IsGoogleUser: user.isGoogleUser ? 'TRUE' : 'FALSE',
                    CreatedAt: new Date().toISOString(),
                    UpdatedAt: new Date().toISOString()
                };
                
                await this.api.appendData('Users', this.api.formatRow(userData, this.sheetConfigs.users.headers));
                console.log('Created new user in Google Sheets');
            } else {
                // Update existing user
                const userId = existingUsers[0];
                await this.updateUser(userId, {
                    Name: user.name,
                    Picture: user.picture || '',
                    UpdatedAt: new Date().toISOString()
                });
            }
            
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Failed to set current user:', error);
            throw error;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.api.isAuthenticated();
    }

    // Sign out user
    async signOut() {
        this.api.signOut();
        this.currentUser = null;
    }

    // Get user by ID
    async getUser(userId) {
        this.ensureInitialized();
        
        try {
            const users = await this.api.readData('Users');
            const userRow = users.find(row => row[0] === userId);
            
            if (!userRow) return null;
            
            return this.parseUserRow(userRow);
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    }

    // Get all users
    async getAllUsers() {
        this.ensureInitialized();
        
        try {
            const users = await this.api.readData('Users');
            return users.slice(1).map(row => this.parseUserRow(row));
        } catch (error) {
            console.error('Failed to get all users:', error);
            return [];
        }
    }

    // Update user
    async updateUser(userId, updateData) {
        this.ensureInitialized();
        
        try {
            const users = await this.api.readData('Users');
            const rowIndex = users.findIndex(row => row[0] === userId);
            
            if (rowIndex === -1) {
                throw new Error('User not found');
            }
            
            const updatedRow = users[rowIndex];
            const headers = this.sheetConfigs.users.headers;
            
            // Update fields
            Object.keys(updateData).forEach(key => {
                const colIndex = headers.indexOf(key);
                if (colIndex !== -1) {
                    updatedRow[colIndex] = updateData[key];
                }
            });
            
            // Update UpdatedAt
            const updatedAtIndex = headers.indexOf('UpdatedAt');
            if (updatedAtIndex !== -1) {
                updatedRow[updatedAtIndex] = new Date().toISOString();
            }
            
            // Write back to sheet
            const range = `Users!A${rowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 1}`;
            await this.api.writeData('Users', range, [updatedRow]);
            
            return this.parseUserRow(updatedRow);
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    // Parse user row to object
    parseUserRow(row) {
        const headers = this.sheetConfigs.users.headers;
        const user = {};
        
        headers.forEach((header, index) => {
            switch (header) {
                case 'IsGoogleUser':
                    user[header] = row[index] === 'TRUE';
                    break;
                default:
                    user[header] = row[index];
            }
        });
        
        return user;
    }

    // Create daily record
    async createDailyRecord(recordData) {
        this.ensureInitialized();
        
        try {
            const nextId = await this.api.getNextId('DailyRecords');
            const record = {
                ID: nextId.toString(),
                UserID: recordData.userId,
                Date: recordData.date,
                TasksCompleted: recordData.tasksCompleted || 0,
                TasksTotal: recordData.tasksTotal || 0,
                HabitsCompleted: recordData.habitsCompleted || 0,
                HabitsTotal: recordData.habitsTotal || 0,
                Productivity: recordData.productivity || 0,
                Mood: recordData.mood || '',
                Notes: recordData.notes || '',
                TasksSubmitted: recordData.tasksSubmitted ? 'TRUE' : 'FALSE',
                Physics: recordData.physics ? 'TRUE' : 'FALSE',
                AdditionalSubjectChemistryMaths: recordData.additional_subject_chemistrymaths ? 'TRUE' : 'FALSE',
                Exercise: recordData.exercise ? 'TRUE' : 'FALSE',
                WakeUp: recordData.wake_up ? 'TRUE' : 'FALSE',
                ScreenControl: recordData.screen_control ? 'TRUE' : 'FALSE',
                ValidDay: recordData.valid_day ? 'TRUE' : 'FALSE',
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString()
            };
            
            await this.api.appendData('DailyRecords', this.api.formatRow(record, this.sheetConfigs.dailyRecords.headers));
            return record;
        } catch (error) {
            console.error('Failed to create daily record:', error);
            throw error;
        }
    }

    // Get daily record
    async getDailyRecord(date) {
        this.ensureInitialized();
        
        try {
            const records = await this.api.readData('DailyRecords');
            const recordRow = records.find(row => row[2] === date); // Date is in column 2
            
            if (!recordRow) return null;
            
            return this.parseDailyRecordRow(recordRow);
        } catch (error) {
            console.error('Failed to get daily record:', error);
            return null;
        }
    }

    // Get daily records for a date range
    async getDailyRecords(startDate, endDate) {
        this.ensureInitialized();
        
        try {
            const records = await this.api.readData('DailyRecords');
            const filteredRecords = records.slice(1).filter(row => {
                const recordDate = row[2]; // Date is in column 2
                return recordDate >= startDate && recordDate <= endDate;
            });
            
            return filteredRecords.map(row => this.parseDailyRecordRow(row));
        } catch (error) {
            console.error('Failed to get daily records:', error);
            return [];
        }
    }

    // Parse daily record row to object
    parseDailyRecordRow(row) {
        const headers = this.sheetConfigs.dailyRecords.headers;
        const record = {};
        
        headers.forEach((header, index) => {
            switch (header) {
                case 'TasksCompleted':
                case 'TasksTotal':
                case 'HabitsCompleted':
                case 'HabitsTotal':
                case 'Productivity':
                    record[header] = parseInt(row[index]) || 0;
                    break;
                case 'TasksSubmitted':
                case 'Physics':
                case 'AdditionalSubjectChemistryMaths':
                case 'Exercise':
                case 'WakeUp':
                case 'ScreenControl':
                case 'ValidDay':
                    record[header] = row[index] === 'TRUE';
                    break;
                default:
                    record[header] = row[index];
            }
        });
        
        return record;
    }

    // Create task
    async createTask(taskData) {
        this.ensureInitialized();
        
        try {
            const nextId = await this.api.getNextId('Tasks');
            const task = {
                ID: nextId.toString(),
                UserID: taskData.userId,
                Title: taskData.title,
                Category: taskData.category,
                Priority: taskData.priority,
                Status: taskData.status || 'pending',
                CompletedAt: taskData.completedAt || '',
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString()
            };
            
            await this.api.appendData('Tasks', this.api.formatRow(task, this.sheetConfigs.tasks.headers));
            return task;
        } catch (error) {
            console.error('Failed to create task:', error);
            throw error;
        }
    }

    // Get tasks
    async getTasks() {
        this.ensureInitialized();
        
        try {
            const tasks = await this.api.readData('Tasks');
            return tasks.slice(1).map(row => this.parseTaskRow(row));
        } catch (error) {
            console.error('Failed to get tasks:', error);
            return [];
        }
    }

    // Update task
    async updateTask(taskId, updateData) {
        this.ensureInitialized();
        
        try {
            const tasks = await this.api.readData('Tasks');
            const rowIndex = tasks.findIndex(row => row[0] === taskId);
            
            if (rowIndex === -1) {
                throw new Error('Task not found');
            }
            
            const updatedRow = tasks[rowIndex];
            const headers = this.sheetConfigs.tasks.headers;
            
            // Update fields
            Object.keys(updateData).forEach(key => {
                const colIndex = headers.indexOf(key);
                if (colIndex !== -1) {
                    updatedRow[colIndex] = updateData[key];
                }
            });
            
            // Update UpdatedAt
            const updatedAtIndex = headers.indexOf('UpdatedAt');
            if (updatedAtIndex !== -1) {
                updatedRow[updatedAtIndex] = new Date().toISOString();
            }
            
            // Write back to sheet
            const range = `Tasks!A${rowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 1}`;
            await this.api.writeData('Tasks', range, [updatedRow]);
            
            return this.parseTaskRow(updatedRow);
        } catch (error) {
            console.error('Failed to update task:', error);
            throw error;
        }
    }

    // Delete task
    async deleteTask(taskId) {
        this.ensureInitialized();
        
        try {
            const tasks = await this.api.readData('Tasks');
            const rowIndex = tasks.findIndex(row => row[0] === taskId);
            
            if (rowIndex === -1) {
                throw new Error('Task not found');
            }
            
            // Delete the row
            const range = `Tasks!${rowIndex + 1}:${rowIndex + 1}`;
            await this.api.clearSheet('Tasks');
            
            // Re-add all other rows
            const remainingTasks = tasks.filter((_, index) => index !== rowIndex);
            if (remainingTasks.length > 0) {
                await this.api.writeData('Tasks', 'A:Z', remainingTasks);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to delete task:', error);
            throw error;
        }
    }

    // Create habit
    async createHabit(habitData) {
        this.ensureInitialized();
        
        try {
            const nextId = await this.api.getNextId('Habits');
            const habit = {
                ID: nextId.toString(),
                UserID: habitData.userId,
                Title: habitData.title,
                Description: habitData.description,
                Category: habitData.category,
                TargetFrequency: habitData.targetFrequency,
                TargetCount: habitData.targetCount,
                Color: habitData.color,
                Icon: habitData.icon,
                IsActive: habitData.isActive ? 'TRUE' : 'FALSE',
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString()
            };
            
            await this.api.appendData('Habits', this.api.formatRow(habit, this.sheetConfigs.habits.headers));
            return habit;
        } catch (error) {
            console.error('Failed to create habit:', error);
            throw error;
        }
    }

    // Get habits
    async getHabits() {
        this.ensureInitialized();
        
        try {
            const habits = await this.api.readData('Habits');
            return habits.slice(1).map(row => this.parseHabitRow(row));
        } catch (error) {
            console.error('Failed to get habits:', error);
            return [];
        }
    }

    // Create user settings
    async createUserSettings(settingsData) {
        this.ensureInitialized();
        
        try {
            const nextId = await this.api.getNextId('UserSettings');
            const settings = {
                ID: nextId.toString(),
                UserID: settingsData.userId,
                Theme: settingsData.theme,
                Notifications: settingsData.notifications ? 'TRUE' : 'FALSE',
                Language: settingsData.language,
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString()
            };
            
            await this.api.appendData('UserSettings', this.api.formatRow(settings, this.sheetConfigs.userSettings.headers));
            return settings;
        } catch (error) {
            console.error('Failed to create user settings:', error);
            throw error;
        }
    }

    // Update daily record
    async updateDailyRecord(recordId, updateData) {
        this.ensureInitialized();
        
        try {
            const records = await this.api.readData('DailyRecords');
            const rowIndex = records.findIndex(row => row[0] === recordId);
            
            if (rowIndex === -1) {
                throw new Error('Daily record not found');
            }
            
            const updatedRow = records[rowIndex];
            const headers = this.sheetConfigs.dailyRecords.headers;
            
            // Update fields
            Object.keys(updateData).forEach(key => {
                const colIndex = headers.indexOf(key);
                if (colIndex !== -1) {
                    updatedRow[colIndex] = updateData[key];
                }
            });
            
            // Update UpdatedAt
            const updatedAtIndex = headers.indexOf('UpdatedAt');
            if (updatedAtIndex !== -1) {
                updatedRow[updatedAtIndex] = new Date().toISOString();
            }
            
            // Write back to sheet
            const range = `DailyRecords!A${rowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 1}`;
            await this.api.writeData('DailyRecords', range, [updatedRow]);
            
            return this.parseDailyRecordRow(updatedRow);
        } catch (error) {
            console.error('Failed to update daily record:', error);
            throw error;
        }
    }

    // Clear a sheet
    async clearSheet(sheetName) {
        this.ensureInitialized();
        
        try {
            await this.api.clearSheet(sheetName);
            console.log(`Cleared sheet: ${sheetName}`);
        } catch (error) {
            console.error('Failed to clear sheet:', error);
            throw error;
        }
    }

    // Setup sheet headers
    async setupSheetHeaders() {
        this.ensureInitialized();
        
        try {
            await this.api.setupSheetHeaders();
            console.log('Sheet headers setup completed');
        } catch (error) {
            console.error('Failed to setup sheet headers:', error);
            throw error;
        }
    }

    // Parse habit row to object
    parseHabitRow(row) {
        const headers = this.sheetConfigs.habits.headers;
        const habit = {};
        
        headers.forEach((header, index) => {
            switch (header) {
                case 'TargetCount':
                    habit[header] = parseInt(row[index]) || 0;
                    break;
                case 'IsActive':
                    habit[header] = row[index] === 'TRUE';
                    break;
                default:
                    habit[header] = row[index];
            }
        });
        
        return habit;
    }

    // Parse user settings row to object
    parseUserSettingsRow(row) {
        const headers = this.sheetConfigs.userSettings.headers;
        const settings = {};
        
        headers.forEach((header, index) => {
            switch (header) {
                case 'Notifications':
                    settings[header] = row[index] === 'TRUE';
                    break;
                default:
                    settings[header] = row[index];
            }
        });
        
        return settings;
    }

    // Get user statistics
    async getStats(days = 30) {
        this.ensureInitialized();
        
        try {
            if (!this.currentUser) {
                throw new Error('No current user');
            }
            
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);
            
            const dailyRecords = await this.getDailyRecords(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
            
            const tasks = await this.getTasks();
            const userTasks = tasks.filter(task => task.UserID === this.currentUser.ID);
            
            return {
                totalDays: dailyRecords.length,
                completedTasks: userTasks.filter(task => task.Status === 'completed').length,
                totalTasks: userTasks.length,
                averageProductivity: dailyRecords.length > 0 
                    ? dailyRecords.reduce((sum, record) => sum + record.Productivity, 0) / dailyRecords.length 
                    : 0,
                currentStreak: await this.calculateCurrentStreak(),
                longestStreak: await this.calculateLongestStreak(),
                validDays: dailyRecords.filter(record => record.ValidDay).length
            };
        } catch (error) {
            console.error('Failed to get stats:', error);
            return null;
        }
    }

    // Calculate current streak
    async calculateCurrentStreak() {
        try {
            const dailyRecords = await this.getDailyRecords();
            const today = new Date();
            let streak = 0;
            let missingInARow = 0;
            const mercyDays = 2;
            
            // Walk backwards from today
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const dailyRecord = dailyRecords.find(record => record.Date === dateStr);
                
                if (dailyRecord && dailyRecord.TasksSubmitted) {
                    if (dailyRecord.ValidDay) {
                        streak++;
                        missingInARow = 0;
                    } else {
                        break;
                    }
                } else {
                    missingInARow++;
                    if (missingInARow > mercyDays) {
                        break;
                    }
                }
            }
            
            return streak;
        } catch (error) {
            console.error('Failed to calculate current streak:', error);
            return 0;
        }
    }

    // Calculate longest streak
    async calculateLongestStreak() {
        try {
            const dailyRecords = await this.getDailyRecords();
            let longestStreak = 0;
            let currentStreak = 0;
            let missingInARow = 0;
            const mercyDays = 2;
            
            for (let i = 0; i < dailyRecords.length; i++) {
                const record = dailyRecords[i];
                
                if (record.ValidDay) {
                    currentStreak++;
                    missingInARow = 0;
                    longestStreak = Math.max(longestStreak, currentStreak);
                } else {
                    currentStreak = 0;
                    missingInARow++;
                    if (missingInARow > mercyDays) {
                        currentStreak = 0;
                    }
                }
            }
            
            return longestStreak;
        } catch (error) {
            console.error('Failed to calculate longest streak:', error);
            return 0;
        }
    }
}

// Make available globally
window.GoogleSheetsDataManager = GoogleSheetsDataManager;

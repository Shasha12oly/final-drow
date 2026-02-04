// File-based Database for Growth Tracker
// Stores data in JSON files that you can edit and see

class FileDatabase {
    constructor() {
        this.dataDir = 'data';
        this.files = {
            users: 'data/users.json',
            dailyRecords: 'data/daily-records.json',
            tasks: 'data/tasks.json',
            habits: 'data/habits.json',
            userSettings: 'data/user-settings.json'
        };
        this.init();
    }

    // Initialize database and create data directory
    init() {
        try {
            // Create data directory structure
            this.ensureDataDirectory();
            
            // Initialize all data files
            this.initializeFile('users', []);
            this.initializeFile('dailyRecords', []);
            this.initializeFile('tasks', []);
            this.initializeFile('habits', []);
            this.initializeFile('userSettings', []);
            
            console.log('File-based database initialized');
        } catch (error) {
            console.error('Failed to initialize file database:', error);
        }
    }

    // Ensure data directory exists (simulated)
    ensureDataDirectory() {
        // In a real server environment, this would create directories
        // For browser, we'll use localStorage as fallback
        if (!localStorage.getItem('fileDatabaseInitialized')) {
            localStorage.setItem('fileDatabaseInitialized', 'true');
        }
    }

    // Initialize a data file
    initializeFile(type, defaultData) {
        const key = `fileDB_${type}`;
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify({
                version: '1.0',
                data: defaultData,
                lastModified: new Date().toISOString()
            }));
        }
    }

    // Read data from file
    readFile(type) {
        try {
            const key = `fileDB_${type}`;
            const fileData = localStorage.getItem(key);
            if (fileData) {
                const parsed = JSON.parse(fileData);
                return parsed.data;
            }
            return [];
        } catch (error) {
            console.error(`Failed to read ${type} file:`, error);
            return [];
        }
    }

    // Write data to file
    writeFile(type, data) {
        try {
            const key = `fileDB_${type}`;
            const fileData = {
                version: '1.0',
                data: data,
                lastModified: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(fileData));
            return true;
        } catch (error) {
            console.error(`Failed to write ${type} file:`, error);
            return false;
        }
    }

    // User Management
    createUser(userData) {
        const users = this.readFile('users');
        const user = {
            id: userData.id || `user_${generateTimestamp()}`,
            name: userData.name,
            email: userData.email,
            picture: userData.picture || '',
            isGoogleUser: userData.isGoogleUser || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        users.push(user);
        this.writeFile('users', users);
        return user;
    }

    getAllUsers() {
        return this.readFile('users');
    }

    getUser(userId) {
        const users = this.readFile('users');
        return users.find(user => user.id === userId) || null;
    }

    updateUser(userId, updateData) {
        const users = this.readFile('users');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date().toISOString() };
            this.writeFile('users', users);
            return users[userIndex];
        }
        return null;
    }

    // Daily Records Management
    createDailyRecord(recordData) {
        const records = this.readFile('dailyRecords');
        const record = {
            id: recordData.id || `record_${generateTimestamp()}`,
            userId: recordData.userId,
            date: recordData.date,
            tasksCompleted: recordData.tasksCompleted || 0,
            tasksTotal: recordData.tasksTotal || 5,
            habitsCompleted: recordData.habitsCompleted || 0,
            habitsTotal: recordData.habitsTotal || 5,
            productivity: recordData.productivity || 0,
            mood: recordData.mood || '',
            notes: recordData.notes || '',
            tasksSubmitted: recordData.tasksSubmitted || false,
            physics: recordData.physics || false,
            additional_subject_chemistrymaths: recordData.additional_subject_chemistrymaths || false,
            exercise: recordData.exercise || false,
            wake_up: recordData.wake_up || false,
            screen_control: recordData.screen_control || false,
            valid_day: recordData.valid_day || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        records.push(record);
        this.writeFile('dailyRecords', records);
        return record;
    }

    getDailyRecord(date) {
        const records = this.readFile('dailyRecords');
        return records.find(record => record.date === date) || null;
    }

    getDailyRecords(startDate, endDate) {
        const records = this.readFile('dailyRecords');
        if (startDate && endDate) {
            return records.filter(record => record.date >= startDate && record.date <= endDate);
        }
        return records;
    }

    updateDailyRecord(recordId, updateData) {
        const records = this.readFile('dailyRecords');
        const recordIndex = records.findIndex(record => record.id === recordId);
        
        if (recordIndex !== -1) {
            records[recordIndex] = { ...records[recordIndex], ...updateData, updatedAt: new Date().toISOString() };
            this.writeFile('dailyRecords', records);
            return records[recordIndex];
        }
        return null;
    }

    // Tasks Management
    createTask(taskData) {
        const tasks = this.readFile('tasks');
        const task = {
            id: taskData.id || `task_${generateTimestamp()}`,
            userId: taskData.userId,
            title: taskData.title,
            category: taskData.category,
            priority: taskData.priority,
            status: taskData.status || 'pending',
            completedAt: taskData.completedAt || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.push(task);
        this.writeFile('tasks', tasks);
        return task;
    }

    getTasks() {
        return this.readFile('tasks');
    }

    updateTask(taskId, updateData) {
        const tasks = this.readFile('tasks');
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updateData, updatedAt: new Date().toISOString() };
            this.writeFile('tasks', tasks);
            return tasks[taskIndex];
        }
        return null;
    }

    deleteTask(taskId) {
        const tasks = this.readFile('tasks');
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks.splice(taskIndex, 1);
            this.writeFile('tasks', tasks);
            return true;
        }
        return false;
    }

    // Habits Management
    createHabit(habitData) {
        const habits = this.readFile('habits');
        const habit = {
            id: habitData.id || `habit_${generateTimestamp()}`,
            userId: habitData.userId,
            title: habitData.title,
            description: habitData.description,
            category: habitData.category,
            targetFrequency: habitData.targetFrequency,
            targetCount: habitData.targetCount,
            color: habitData.color,
            icon: habitData.icon,
            isActive: habitData.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        habits.push(habit);
        this.writeFile('habits', habits);
        return habit;
    }

    getHabits() {
        return this.readFile('habits');
    }

    // User Settings Management
    createUserSettings(settingsData) {
        const settings = this.readFile('userSettings');
        const setting = {
            id: settingsData.id || `settings_${generateTimestamp()}`,
            userId: settingsData.userId,
            theme: settingsData.theme || 'light',
            notifications: settingsData.notifications !== false,
            language: settingsData.language || 'en',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        settings.push(setting);
        this.writeFile('userSettings', settings);
        return setting;
    }

    getUserSettings(userId) {
        const settings = this.readFile('userSettings');
        return settings.find(setting => setting.userId === userId) || null;
    }

    // Export all data as downloadable files
    exportAllData() {
        const exportData = {
            users: this.readFile('users'),
            dailyRecords: this.readFile('dailyRecords'),
            tasks: this.readFile('tasks'),
            habits: this.readFile('habits'),
            userSettings: this.readFile('userSettings'),
            exportedAt: new Date().toISOString()
        };
        
        return exportData;
    }

    // Import data from files
    importData(importData) {
        try {
            if (importData.users) this.writeFile('users', importData.users);
            if (importData.dailyRecords) this.writeFile('dailyRecords', importData.dailyRecords);
            if (importData.tasks) this.writeFile('tasks', importData.tasks);
            if (importData.habits) this.writeFile('habits', importData.habits);
            if (importData.userSettings) this.writeFile('userSettings', importData.userSettings);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Download data as JSON file
    downloadDataFile(type) {
        const data = this.readFile(type);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Get database statistics
    getStats() {
        return {
            usersCount: this.readFile('users').length,
            dailyRecordsCount: this.readFile('dailyRecords').length,
            tasksCount: this.readFile('tasks').length,
            habitsCount: this.readFile('habits').length,
            userSettingsCount: this.readFile('userSettings').length,
            lastModified: new Date().toISOString()
        };
    }

    // Clear all data
    clearAllData() {
        this.writeFile('users', []);
        this.writeFile('dailyRecords', []);
        this.writeFile('tasks', []);
        this.writeFile('habits', []);
        this.writeFile('userSettings', []);
    }
}

// Helper function for unique IDs
function generateTimestamp() {
    return new Date().getTime();
}

// Make available globally
window.FileDatabase = FileDatabase;

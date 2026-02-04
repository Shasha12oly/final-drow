// Simple LocalStorage Database for Growth Tracker
// Replaces Google Sheets with localStorage

class LocalStorageDatabase {
    constructor() {
        this.dbName = 'growthTrackerDB';
        this.version = '1.0';
        this.init();
    }

    // Initialize database
    init() {
        if (!localStorage.getItem(this.dbName)) {
            localStorage.setItem(this.dbName, JSON.stringify({
                version: this.version,
                users: [],
                dailyRecords: [],
                tasks: [],
                habits: [],
                userSettings: [],
                createdAt: new Date().toISOString()
            }));
        }
    }

    // Get all data
    getAllData() {
        const data = localStorage.getItem(this.dbName);
        return data ? JSON.parse(data) : {};
    }

    // Save all data
    saveAllData(data) {
        localStorage.setItem(this.dbName, JSON.stringify(data));
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.dbName);
        this.init();
    }

    // User Management
    createUser(userData) {
        const data = this.getAllData();
        const user = {
            id: userData.id || `user_${generateTimestamp()}`,
            name: userData.name,
            email: userData.email,
            picture: userData.picture || '',
            isGoogleUser: userData.isGoogleUser || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.users.push(user);
        this.saveAllData(data);
        return user;
    }

    getAllUsers() {
        const data = this.getAllData();
        return data.users || [];
    }

    getUser(userId) {
        const data = this.getAllData();
        return data.users.find(user => user.id === userId) || null;
    }

    updateUser(userId, updateData) {
        const data = this.getAllData();
        const userIndex = data.users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            data.users[userIndex] = { ...data.users[userIndex], ...updateData, updatedAt: new Date().toISOString() };
            this.saveAllData(data);
            return data.users[userIndex];
        }
        return null;
    }

    // Daily Records Management
    createDailyRecord(recordData) {
        const data = this.getAllData();
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
        
        data.dailyRecords.push(record);
        this.saveAllData(data);
        return record;
    }

    getDailyRecord(date) {
        const data = this.getAllData();
        return data.dailyRecords.find(record => record.date === date) || null;
    }

    getDailyRecords(startDate, endDate) {
        const data = this.getAllData();
        let records = data.dailyRecords || [];
        
        if (startDate && endDate) {
            records = records.filter(record => record.date >= startDate && record.date <= endDate);
        }
        
        return records;
    }

    updateDailyRecord(recordId, updateData) {
        const data = this.getAllData();
        const recordIndex = data.dailyRecords.findIndex(record => record.id === recordId);
        
        if (recordIndex !== -1) {
            data.dailyRecords[recordIndex] = { ...data.dailyRecords[recordIndex], ...updateData, updatedAt: new Date().toISOString() };
            this.saveAllData(data);
            return data.dailyRecords[recordIndex];
        }
        return null;
    }

    // Tasks Management
    createTask(taskData) {
        const data = this.getAllData();
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
        
        data.tasks.push(task);
        this.saveAllData(data);
        return task;
    }

    getTasks() {
        const data = this.getAllData();
        return data.tasks || [];
    }

    updateTask(taskId, updateData) {
        const data = this.getAllData();
        const taskIndex = data.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updateData, updatedAt: new Date().toISOString() };
            this.saveAllData(data);
            return data.tasks[taskIndex];
        }
        return null;
    }

    deleteTask(taskId) {
        const data = this.getAllData();
        const taskIndex = data.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            data.tasks.splice(taskIndex, 1);
            this.saveAllData(data);
            return true;
        }
        return false;
    }

    // Habits Management
    createHabit(habitData) {
        const data = this.getAllData();
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
        
        data.habits.push(habit);
        this.saveAllData(data);
        return habit;
    }

    getHabits() {
        const data = this.getAllData();
        return data.habits || [];
    }

    // User Settings Management
    createUserSettings(settingsData) {
        const data = this.getAllData();
        const settings = {
            id: settingsData.id || `settings_${generateTimestamp()}`,
            userId: settingsData.userId,
            theme: settingsData.theme || 'light',
            notifications: settingsData.notifications !== false,
            language: settingsData.language || 'en',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.userSettings.push(settings);
        this.saveAllData(data);
        return settings;
    }

    getUserSettings(userId) {
        const data = this.getAllData();
        return data.userSettings.find(settings => settings.userId === userId) || null;
    }

    // Utility Functions
    exportData() {
        return this.getAllData();
    }

    importData(importData) {
        localStorage.setItem(this.dbName, JSON.stringify(importData));
    }

    getStats() {
        const data = this.getAllData();
        return {
            usersCount: data.users ? data.users.length : 0,
            dailyRecordsCount: data.dailyRecords ? data.dailyRecords.length : 0,
            tasksCount: data.tasks ? data.tasks.length : 0,
            habitsCount: data.habits ? data.habits.length : 0,
            userSettingsCount: data.userSettings ? data.userSettings.length : 0,
            createdAt: data.createdAt,
            version: data.version
        };
    }
}

// Helper function for unique IDs
function generateTimestamp() {
    return new Date().getTime();
}

// Make available globally
window.LocalStorageDatabase = LocalStorageDatabase;

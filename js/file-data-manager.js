// File-based Data Manager for Growth Tracker
// Uses JSON files that you can edit and see

class FileDataManager {
    constructor() {
        this.db = new FileDatabase();
        this.currentUser = null;
        this.isInitialized = false;
    }

    // Initialize data manager
    async init() {
        try {
            this.isInitialized = true;
            console.log('File-based Data Manager initialized');
        } catch (error) {
            console.error('Failed to initialize File Data Manager:', error);
            throw error;
        }
    }

    // Ensure initialized
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('File Data Manager not initialized');
        }
    }

    // Set current user
    async setCurrentUser(user) {
        this.ensureInitialized();
        
        try {
            // Check if user already exists
            let existingUser = this.db.getUser(user.id);
            
            if (!existingUser) {
                // Create new user
                existingUser = this.db.createUser(user);
                console.log('Created new user in file database');
            } else {
                // Update existing user
                existingUser = this.db.updateUser(user.id, {
                    name: user.name,
                    picture: user.picture || '',
                    updatedAt: new Date().toISOString()
                });
            }
            
            this.currentUser = existingUser;
            return existingUser;
        } catch (error) {
            console.error('Failed to set current user:', error);
            throw error;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Sign out
    async signOut() {
        this.currentUser = null;
    }

    // Get user by ID
    async getUser(userId) {
        this.ensureInitialized();
        return this.db.getUser(userId);
    }

    // Get all users
    async getAllUsers() {
        this.ensureInitialized();
        return this.db.getAllUsers();
    }

    // Update user
    async updateUser(userId, updateData) {
        this.ensureInitialized();
        return this.db.updateUser(userId, updateData);
    }

    // Create daily record
    async createDailyRecord(recordData) {
        this.ensureInitialized();
        return this.db.createDailyRecord({
            userId: recordData.userId || this.currentUser.id,
            ...recordData
        });
    }

    // Get daily record
    async getDailyRecord(date) {
        this.ensureInitialized();
        return this.db.getDailyRecord(date);
    }

    // Get daily records
    async getDailyRecords(startDate, endDate) {
        this.ensureInitialized();
        return this.db.getDailyRecords(startDate, endDate);
    }

    // Update daily record
    async updateDailyRecord(recordId, updateData) {
        this.ensureInitialized();
        return this.db.updateDailyRecord(recordId, updateData);
    }

    // Create task
    async createTask(taskData) {
        this.ensureInitialized();
        return this.db.createTask({
            userId: taskData.userId || this.currentUser.id,
            ...taskData
        });
    }

    // Get tasks
    async getTasks() {
        this.ensureInitialized();
        return this.db.getTasks();
    }

    // Update task
    async updateTask(taskId, updateData) {
        this.ensureInitialized();
        return this.db.updateTask(taskId, updateData);
    }

    // Delete task
    async deleteTask(taskId) {
        this.ensureInitialized();
        return this.db.deleteTask(taskId);
    }

    // Create habit
    async createHabit(habitData) {
        this.ensureInitialized();
        return this.db.createHabit({
            userId: habitData.userId || this.currentUser.id,
            ...habitData
        });
    }

    // Get habits
    async getHabits() {
        this.ensureInitialized();
        return this.db.getHabits();
    }

    // Create user settings
    async createUserSettings(settingsData) {
        this.ensureInitialized();
        return this.db.createUserSettings({
            userId: settingsData.userId || this.currentUser.id,
            ...settingsData
        });
    }

    // Get user settings
    async getUserSettings(userId) {
        this.ensureInitialized();
        return this.db.getUserSettings(userId || this.currentUser.id);
    }

    // Get statistics
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
            const userTasks = tasks.filter(task => task.userId === this.currentUser.id);
            
            return {
                totalDays: dailyRecords.length,
                completedTasks: userTasks.filter(task => task.status === 'completed').length,
                totalTasks: userTasks.length,
                averageProductivity: dailyRecords.length > 0 
                    ? dailyRecords.reduce((sum, record) => sum + record.productivity, 0) / dailyRecords.length 
                    : 0,
                currentStreak: this.calculateCurrentStreak(dailyRecords),
                longestStreak: this.calculateLongestStreak(dailyRecords),
                validDays: dailyRecords.filter(record => record.valid_day).length
            };
        } catch (error) {
            console.error('Failed to get stats:', error);
            return null;
        }
    }

    // Calculate current streak
    calculateCurrentStreak(dailyRecords) {
        try {
            const today = new Date();
            let streak = 0;
            let missingInARow = 0;
            const mercyDays = 2;
            
            // Walk backwards from today
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const dailyRecord = dailyRecords.find(record => record.date === dateStr);
                
                if (dailyRecord && dailyRecord.tasksSubmitted) {
                    if (dailyRecord.valid_day) {
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
    calculateLongestStreak(dailyRecords) {
        try {
            if (dailyRecords.length === 0) return 0;
            
            // Sort by date
            dailyRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let longestStreak = 0;
            let currentStreak = 0;
            let missingInARow = 0;
            const mercyDays = 2;
            
            for (let i = 0; i < dailyRecords.length; i++) {
                const record = dailyRecords[i];
                
                if (record.valid_day) {
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

    // Export all data
    async exportAllData() {
        this.ensureInitialized();
        return this.db.exportAllData();
    }

    // Import data
    async importData(data) {
        this.ensureInitialized();
        return this.db.importData(data);
    }

    // Download data file
    downloadDataFile(type) {
        this.ensureInitialized();
        this.db.downloadDataFile(type);
    }

    // Get database statistics
    getDatabaseStats() {
        return this.db.getStats();
    }

    // Clear all data
    async clearAllData() {
        this.ensureInitialized();
        this.db.clearAllData();
        this.currentUser = null;
    }
}

// Make available globally
window.FileDataManager = FileDataManager;

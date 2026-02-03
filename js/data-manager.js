/**
 * Data Manager - High-level interface for database operations
 * Provides a simplified API for working with the Growth Tracker database
 */

class DataManager {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the data manager
     */
    async init() {
        try {
            this.db = new GrowthTrackerDB();
            await this.db.init();
            
            // Check for existing user session
            await this.loadCurrentUser();
            
            // Attempt migration from localStorage if needed
            await this.migrateIfNeeded();
            
            this.isInitialized = true;
            console.log('Data Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Data Manager:', error);
            return false;
        }
    }

    /**
     * Load current user from session
     */
    async loadCurrentUser() {
        try {
            const googleUser = localStorage.getItem('googleUser');
            if (googleUser) {
                const userData = JSON.parse(googleUser);
                
                // Try to get user from database
                let user = await this.db.getUserByEmail(userData.email);
                
                // If user doesn't exist in database, create them
                if (!user) {
                    user = await this.db.createUser({
                        id: userData.id,
                        googleId: userData.id,
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture,
                        createdAt: userData.signedUpAt
                    });
                }
                
                this.currentUser = user;
                return user;
            }
        } catch (error) {
            console.error('Failed to load current user:', error);
        }
        return null;
    }

    /**
     * Set current user (for authentication)
     */
    async setCurrentUser(userData) {
        try {
            // Store in localStorage for session persistence
            localStorage.setItem('googleUser', JSON.stringify(userData));
            
            // Create or update user in database
            let user = await this.db.getUserByEmail(userData.email);
            
            if (!user) {
                user = await this.db.createUser({
                    id: userData.id,
                    googleId: userData.id,
                    email: userData.email,
                    name: userData.name,
                    picture: userData.picture,
                    createdAt: userData.signedUpAt
                });
            } else {
                await this.db.updateUser(user.id, {
                    lastLogin: new Date().toISOString(),
                    picture: userData.picture || user.picture
                });
            }
            
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Failed to set current user:', error);
            throw error;
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            // Clear localStorage
            localStorage.removeItem('googleUser');
            localStorage.removeItem('googleCredential');
            
            // Clear current user
            this.currentUser = null;
            
            console.log('User signed out successfully');
            return true;
        } catch (error) {
            console.error('Failed to sign out:', error);
            return false;
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * User Management Methods
     */
    async getAllUsers() {
        this.ensureInitialized();
        return await this.db.getAllUsers();
    }

    async getUser(userId) {
        this.ensureInitialized();
        return await this.db.getUser(userId);
    }

    /**
     * Task Management Methods
     */
    async createTask(taskData) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.createTask({
            ...taskData,
            userId: this.currentUser.id
        });
    }

    async getTasks(filters = {}) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.getTasks(this.currentUser.id, filters);
    }

    async updateTask(taskId, updates) {
        this.ensureInitialized();
        return await this.db.updateTask(taskId, updates);
    }

    async deleteTask(taskId) {
        this.ensureInitialized();
        return await this.db.deleteTask(taskId);
    }

    async getTaskStats(dateRange = null) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const tasks = await this.getTasks();
        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            overdue: tasks.filter(t => {
                return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
            }).length
        };

        // Calculate completion rate
        stats.completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0;

        return stats;
    }

    /**
     * Habit Management Methods
     */
    async createHabit(habitData) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.createHabit({
            ...habitData,
            userId: this.currentUser.id
        });
    }

    async getHabits(activeOnly = false) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.getHabits(this.currentUser.id, activeOnly);
    }

    async trackHabit(habitId, date = null, completed = true) {
        this.ensureInitialized();
        const trackDate = date || new Date().toISOString().split('T')[0];
        return await this.db.trackHabit(habitId, trackDate, completed);
    }

    async getHabitTracking(habitId, startDate, endDate) {
        this.ensureInitialized();
        return await this.db.getHabitTracking(habitId, startDate, endDate);
    }

    /**
     * Daily Records Methods
     */
    async createDailyRecord(recordData) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.createDailyRecord({
            ...recordData,
            userId: this.currentUser.id
        });
    }

    async getDailyRecord(date = null) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const recordDate = date || new Date().toISOString().split('T')[0];
        return await this.db.getDailyRecord(this.currentUser.id, recordDate);
    }

    async getDailyRecords(startDate = null, endDate = null) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.getDailyRecords(this.currentUser.id, startDate, endDate);
    }

    /**
     * User Settings Methods
     */
    async saveSettings(settings) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.saveUserSettings(this.currentUser.id, settings);
    }

    async getSettings() {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.getUserSettings(this.currentUser.id);
    }

    /**
     * Analytics Methods
     */
    async getStats(days = 30) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        return await this.db.getUserStats(this.currentUser.id, days);
    }

    async getWeeklyProgress() {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const [tasks, dailyRecords] = await Promise.all([
            this.getTasks(),
            this.getDailyRecords(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            )
        ]);

        // Calculate weekly progress
        const weekData = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayTasks = tasks.filter(task => 
                new Date(task.createdAt).toDateString() === date.toDateString()
            );
            
            const dayRecord = dailyRecords.find(record => record.date === dateStr);
            
            weekData.push({
                date: dateStr,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                tasksCompleted: dayTasks.filter(t => t.status === 'completed').length,
                tasksTotal: dayTasks.length,
                productivity: dayRecord?.productivity || 0,
                mood: dayRecord?.mood || null
            });
        }

        return weekData;
    }

    /**
     * Data Migration
     */
    async migrateIfNeeded() {
        try {
            // Check if migration is needed
            const hasOldData = localStorage.getItem('googleUser') || 
                              localStorage.getItem('growthTrackerData') || 
                              localStorage.getItem('tasks');
            
            if (hasOldData) {
                console.log('Starting data migration from localStorage...');
                const migrated = await this.db.migrateFromLocalStorage();
                
                if (migrated) {
                    console.log('Data migration completed successfully');
                    // Optionally clear old data after successful migration
                    // this.clearOldData();
                }
            }
        } catch (error) {
            console.error('Migration failed:', error);
        }
    }

    /**
     * Clear old localStorage data (call after successful migration)
     */
    clearOldData() {
        const keysToRemove = ['growthTrackerData', 'tasks', 'habitData', 'profileData'];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('Old localStorage data cleared');
    }

    /**
     * Utility Methods
     */
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Data Manager not initialized. Call init() first.');
        }
    }

    /**
     * Export user data (for backup)
     */
    async exportData() {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        try {
            const [tasks, habits, dailyRecords, settings] = await Promise.all([
                this.getTasks(),
                this.getHabits(),
                this.getDailyRecords(),
                this.getSettings()
            ]);

            const exportData = {
                user: this.currentUser,
                tasks,
                habits,
                dailyRecords,
                settings,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };

            return exportData;
        } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
        }
    }

    /**
     * Import user data (for restore)
     */
    async importData(importData) {
        this.ensureInitialized();
        if (!this.currentUser) throw new Error('User not authenticated');
        
        try {
            // Validate import data
            if (!importData.version || !importData.user) {
                throw new Error('Invalid import data format');
            }

            // Clear existing data (optional - you might want to merge instead)
            await this.db.clearAllData();

            // Re-create user
            await this.db.createUser(importData.user);

            // Import tasks
            for (const task of importData.tasks || []) {
                await this.db.createTask(task);
            }

            // Import habits
            for (const habit of importData.habits || []) {
                await this.db.createHabit(habit);
            }

            // Import daily records
            for (const record of importData.dailyRecords || []) {
                await this.db.createDailyRecord(record);
            }

            // Import settings
            if (importData.settings) {
                await this.db.saveUserSettings(this.currentUser.id, importData.settings);
            }

            console.log('Data import completed successfully');
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            throw error;
        }
    }
}

// Create global instance
window.dataManager = new DataManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.dataManager.init();
    } catch (error) {
        console.error('Failed to auto-initialize Data Manager:', error);
    }
});

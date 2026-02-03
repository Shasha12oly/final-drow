/**
 * Growth Tracker Database Manager
 * IndexedDB implementation for storing user data, tasks, and daily records
 */

class GrowthTrackerDB {
    constructor() {
        this.dbName = 'GrowthTrackerDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('googleId', 'googleId', { unique: false });
                }

                // Tasks store
                if (!db.objectStoreNames.contains('tasks')) {
                    const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
                    taskStore.createIndex('userId', 'userId', { unique: false });
                    taskStore.createIndex('date', 'date', { unique: false });
                    taskStore.createIndex('status', 'status', { unique: false });
                    taskStore.createIndex('category', 'category', { unique: false });
                }

                // Daily records store
                if (!db.objectStoreNames.contains('dailyRecords')) {
                    const dailyStore = db.createObjectStore('dailyRecords', { keyPath: 'id', autoIncrement: true });
                    dailyStore.createIndex('userId', 'userId', { unique: false });
                    dailyStore.createIndex('date', 'date', { unique: false });
                    dailyStore.createIndex('userId_date', ['userId', 'date'], { unique: true });
                }

                // Habits store
                if (!db.objectStoreNames.contains('habits')) {
                    const habitStore = db.createObjectStore('habits', { keyPath: 'id', autoIncrement: true });
                    habitStore.createIndex('userId', 'userId', { unique: false });
                    habitStore.createIndex('isActive', 'isActive', { unique: false });
                }

                // Habit tracking store
                if (!db.objectStoreNames.contains('habitTracking')) {
                    const trackingStore = db.createObjectStore('habitTracking', { keyPath: 'id', autoIncrement: true });
                    trackingStore.createIndex('habitId', 'habitId', { unique: false });
                    trackingStore.createIndex('date', 'date', { unique: false });
                    trackingStore.createIndex('habitId_date', ['habitId', 'date'], { unique: true });
                }

                // User settings store
                if (!db.objectStoreNames.contains('userSettings')) {
                    db.createObjectStore('userSettings', { keyPath: 'userId' });
                }

                console.log('Database schema created');
            };
        });
    }

    /**
     * User Management Methods
     */
    async createUser(userData) {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        const user = {
            id: userData.id || `user_${Date.now()}`,
            name: userData.name,
            email: userData.email,
            picture: userData.picture || null,
            isGoogleUser: userData.isGoogleUser || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(user);
            request.onsuccess = () => resolve(user);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllUsers() {
        const transaction = this.db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUser(userId) {
        const transaction = this.db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        
        return new Promise((resolve, reject) => {
            const request = store.get(userId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserByEmail(email) {
        const transaction = this.db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const index = store.index('email');
        
        return new Promise((resolve, reject) => {
            const request = index.get(email);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateUser(userId, updates) {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(userId);
            getRequest.onsuccess = () => {
                const user = getRequest.result;
                if (user) {
                    Object.assign(user, updates, { lastUpdated: new Date().toISOString() });
                    const putRequest = store.put(user);
                    putRequest.onsuccess = () => resolve(user);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('User not found'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Task Management Methods
     */
    async createTask(taskData) {
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        const task = {
            id: taskData.id || `task_${Date.now()}`,
            userId: taskData.userId,
            title: taskData.title,
            description: taskData.description || '',
            category: taskData.category || 'general',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'pending',
            dueDate: taskData.dueDate || null,
            completedAt: taskData.completedAt || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(task);
            request.onsuccess = () => resolve(task);
            request.onerror = () => reject(request.error);
        });
    }

    async getTasks(userId, filters = {}) {
        const transaction = this.db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        
        return new Promise((resolve, reject) => {
            const request = store.index('userId').getAll(userId);
            request.onsuccess = () => {
                let tasks = request.result;
                
                // Apply filters
                if (filters.status) {
                    tasks = tasks.filter(task => task.status === filters.status);
                }
                if (filters.category) {
                    tasks = tasks.filter(task => task.category === filters.category);
                }
                if (filters.priority) {
                    tasks = tasks.filter(task => task.priority === filters.priority);
                }
                if (filters.date) {
                    tasks = tasks.filter(task => 
                        new Date(task.createdAt).toDateString() === new Date(filters.date).toDateString()
                    );
                }
                
                // Sort by creation date (newest first)
                tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                resolve(tasks);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateTask(taskId, updates) {
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(taskId);
            getRequest.onsuccess = () => {
                const task = getRequest.result;
                if (task) {
                    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
                    const putRequest = store.put(task);
                    putRequest.onsuccess = () => resolve(task);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Task not found'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteTask(taskId) {
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(taskId);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Daily Records Methods
     */
    async createDailyRecord(recordData) {
        const transaction = this.db.transaction(['dailyRecords'], 'readwrite');
        const store = transaction.objectStore('dailyRecords');
        
        const record = {
            id: recordData.id || `record_${Date.now()}`,
            userId: recordData.userId,
            date: recordData.date,
            tasksCompleted: recordData.tasksCompleted || 0,
            tasksTotal: recordData.tasksTotal || 0,
            habitsCompleted: recordData.habitsCompleted || 0,
            habitsTotal: recordData.habitsTotal || 0,
            productivity: recordData.productivity || 0,
            mood: recordData.mood || null,
            notes: recordData.notes || '',
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
        });
    }

    async getDailyRecord(userId, date) {
        const transaction = this.db.transaction(['dailyRecords'], 'readonly');
        const store = transaction.objectStore('dailyRecords');
        const index = store.index('userId_date');
        
        return new Promise((resolve, reject) => {
            const request = index.get([userId, date]);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDailyRecords(userId, startDate, endDate) {
        const transaction = this.db.transaction(['dailyRecords'], 'readonly');
        const store = transaction.objectStore('dailyRecords');
        
        return new Promise((resolve, reject) => {
            const request = store.index('userId').getAll(userId);
            request.onsuccess = () => {
                let records = request.result;
                
                // Filter by date range if provided
                if (startDate) {
                    records = records.filter(record => record.date >= startDate);
                }
                if (endDate) {
                    records = records.filter(record => record.date <= endDate);
                }
                
                // Sort by date
                records.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                resolve(records);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateDailyRecord(recordId, updateData) {
        const transaction = this.db.transaction(['dailyRecords'], 'readwrite');
        const store = transaction.objectStore('dailyRecords');
        
        // First get the existing record
        const existingRecord = await new Promise((resolve, reject) => {
            const request = store.get(recordId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        if (!existingRecord) {
            throw new Error('Daily record not found');
        }
        
        // Update the record
        const updatedRecord = {
            ...existingRecord,
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(updatedRecord);
            request.onsuccess = () => resolve(updatedRecord);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Habits Management Methods
     */
    async createHabit(habitData) {
        const transaction = this.db.transaction(['habits'], 'readwrite');
        const store = transaction.objectStore('habits');
        
        const habit = {
            id: habitData.id || `habit_${Date.now()}`,
            userId: habitData.userId,
            title: habitData.title,
            description: habitData.description || '',
            category: habitData.category || 'general',
            targetFrequency: habitData.targetFrequency || 'daily',
            targetCount: habitData.targetCount || 1,
            color: habitData.color || '#4F46E5',
            icon: habitData.icon || 'fas fa-check',
            isActive: habitData.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(habit);
            request.onsuccess = () => resolve(habit);
            request.onerror = () => reject(request.error);
        });
    }

    async getHabits(userId, activeOnly = false) {
        const transaction = this.db.transaction(['habits'], 'readonly');
        const store = transaction.objectStore('habits');
        
        return new Promise((resolve, reject) => {
            const request = store.index('userId').getAll(userId);
            request.onsuccess = () => {
                let habits = request.result;
                
                if (activeOnly) {
                    habits = habits.filter(habit => habit.isActive);
                }
                
                // Sort by creation date (newest first)
                habits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                resolve(habits);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async trackHabit(habitId, date, completed = true) {
        const transaction = this.db.transaction(['habitTracking'], 'readwrite');
        const store = transaction.objectStore('habitTracking');
        
        const tracking = {
            id: `tracking_${habitId}_${date}`,
            habitId: habitId,
            date: date,
            completed: completed,
            completedAt: completed ? new Date().toISOString() : null,
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(tracking);
            request.onsuccess = () => resolve(tracking);
            request.onerror = () => reject(request.error);
        });
    }

    async getHabitTracking(habitId, startDate, endDate) {
        const transaction = this.db.transaction(['habitTracking'], 'readonly');
        const store = transaction.objectStore('habitTracking');
        
        return new Promise((resolve, reject) => {
            const request = store.index('habitId').getAll(habitId);
            request.onsuccess = () => {
                let tracking = request.result;
                
                // Filter by date range
                if (startDate) {
                    tracking = tracking.filter(record => record.date >= startDate);
                }
                if (endDate) {
                    tracking = tracking.filter(record => record.date <= endDate);
                }
                
                // Sort by date
                tracking.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                resolve(tracking);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * User Settings Methods
     */
    async saveUserSettings(userId, settings) {
        const transaction = this.db.transaction(['userSettings'], 'readwrite');
        const store = transaction.objectStore('userSettings');
        
        const userSettings = {
            userId: userId,
            theme: settings.theme || 'light',
            notifications: settings.notifications || true,
            dailyReminder: settings.dailyReminder || '09:00',
            weekStart: settings.weekStart || 'monday',
            language: settings.language || 'en',
            timezone: settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(userSettings);
            request.onsuccess = () => resolve(userSettings);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserSettings(userId) {
        const transaction = this.db.transaction(['userSettings'], 'readonly');
        const store = transaction.objectStore('userSettings');
        
        return new Promise((resolve, reject) => {
            const request = store.get(userId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Analytics Methods
     */
    async getUserStats(userId, days = 30) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        
        const [tasks, dailyRecords, habits] = await Promise.all([
            this.getTasks(userId),
            this.getDailyRecords(userId, startDate, endDate),
            this.getHabits(userId, true)
        ]);

        const stats = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(task => task.status === 'completed').length,
            activeHabits: habits.length,
            totalDays: dailyRecords.length,
            productivity: 0,
            streak: 0,
            weeklyProgress: []
        };

        // Calculate completion rate
        if (stats.totalTasks > 0) {
            stats.completionRate = (stats.completedTasks / stats.totalTasks * 100).toFixed(1);
        }

        // Calculate average productivity
        if (dailyRecords.length > 0) {
            const totalProductivity = dailyRecords.reduce((sum, record) => sum + record.productivity, 0);
            stats.productivity = (totalProductivity / dailyRecords.length).toFixed(1);
        }

        return stats;
    }

    /**
     * Data Migration from localStorage
     */
    async migrateFromLocalStorage() {
        try {
            // Migrate user data
            const googleUser = localStorage.getItem('googleUser');
            if (googleUser) {
                const userData = JSON.parse(googleUser);
                const existingUser = await this.getUserByEmail(userData.email);
                
                if (!existingUser) {
                    await this.createUser({
                        id: userData.id,
                        googleId: userData.id,
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture,
                        createdAt: userData.signedUpAt
                    });
                }
            }

            // Migrate growth tracker data
            const growthData = localStorage.getItem('growthTrackerData');
            if (growthData) {
                const data = JSON.parse(growthData);
                // Handle migration of habit data, tasks, etc.
                console.log('Migrating growth tracker data:', data);
            }

            // Migrate tasks
            const tasks = localStorage.getItem('tasks');
            if (tasks) {
                const taskData = JSON.parse(tasks);
                // Migrate tasks to new format
                console.log('Migrating tasks:', taskData);
            }

            console.log('Data migration completed');
            return true;
        } catch (error) {
            console.error('Migration failed:', error);
            return false;
        }
    }

    /**
     * Clear all data (for testing/reset)
     */
    async clearAllData() {
        const stores = ['users', 'tasks', 'dailyRecords', 'habits', 'habitTracking', 'userSettings'];
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.clear();
        }
        
        console.log('All data cleared from database');
    }
}

// Export for use in other files
window.GrowthTrackerDB = GrowthTrackerDB;

// Default Data Initialization for Google Sheets
// Creates default users, tasks, and initial data

class DefaultDataInitializer {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.defaultUsers = [
            {
                name: 'Demo User',
                email: 'demo@growthtracker.com',
                picture: '',
                isGoogleUser: false
            },
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                picture: '',
                isGoogleUser: false
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                picture: '',
                isGoogleUser: false
            },
            {
                name: 'Alex Johnson',
                email: 'alex.johnson@example.com',
                picture: '',
                isGoogleUser: false
            },
            {
                name: 'Sarah Wilson',
                email: 'sarah.wilson@example.com',
                picture: '',
                isGoogleUser: false
            }
        ];

        this.defaultHabits = [
            {
                title: 'Physics',
                description: '45 minutes minimum study',
                category: 'Academic',
                targetFrequency: 'daily',
                targetCount: 45,
                color: '#3b82f6',
                icon: 'fas fa-atom',
                isActive: true
            },
            {
                title: 'Additional Subject',
                description: 'Chemistry or Maths 45 minutes',
                category: 'Academic',
                targetFrequency: 'daily',
                targetCount: 45,
                color: '#10b981',
                icon: 'fas fa-flask',
                isActive: true
            },
            {
                title: 'Exercise',
                description: '50 pushups + 50 situps OR 2km run',
                category: 'Health',
                targetFrequency: 'daily',
                targetCount: 1,
                color: '#8b5cf6',
                icon: 'fas fa-running',
                isActive: true
            },
            {
                title: 'Wake Up',
                description: 'Before 6:00 AM',
                category: 'Discipline',
                targetFrequency: 'daily',
                targetCount: 1,
                color: '#f59e0b',
                icon: 'fas fa-clock',
                isActive: true
            },
            {
                title: 'Screen Control',
                description: 'Less than 1 hour wasteful time',
                category: 'Discipline',
                targetFrequency: 'daily',
                targetCount: 1,
                color: '#ef4444',
                icon: 'fas fa-mobile-alt',
                isActive: true
            }
        ];

        this.defaultTasks = [
            {
                title: 'Physics Study Session',
                category: 'Academic',
                priority: 'high',
                status: 'pending'
            },
            {
                title: 'Chemistry Problem Set',
                category: 'Academic',
                priority: 'high',
                status: 'pending'
            },
            {
                title: 'Morning Exercise',
                category: 'Health',
                priority: 'medium',
                status: 'pending'
            },
            {
                title: 'Wake Up Early',
                category: 'Discipline',
                priority: 'high',
                status: 'pending'
            },
            {
                title: 'Limit Screen Time',
                category: 'Discipline',
                priority: 'medium',
                status: 'pending'
            }
        ];

        this.defaultUserSettings = [
            {
                theme: 'light',
                notifications: true,
                language: 'en'
            }
        ];
    }

    // Initialize all default data
    async initializeAllDefaults() {
        try {
            console.log('Initializing default data...');
            
            // Check if data already exists
            const existingUsers = await this.dataManager.getAllUsers();
            if (existingUsers.length > 0) {
                console.log('Default data already exists, skipping initialization');
                return false;
            }

            // Create default users
            await this.createDefaultUsers();
            
            // Create default habits for each user
            await this.createDefaultHabits();
            
            // Create default tasks for each user
            await this.createDefaultTasks();
            
            // Create default user settings
            await this.createDefaultUserSettings();
            
            // Create sample daily records for the past 30 days
            await this.createSampleDailyRecords();
            
            console.log('Default data initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize default data:', error);
            throw error;
        }
    }

    // Create default users
    async createDefaultUsers() {
        try {
            console.log('Creating default users...');
            
            for (const userData of this.defaultUsers) {
                await this.dataManager.setCurrentUser(userData);
                console.log(`Created user: ${userData.name}`);
            }
            
        } catch (error) {
            console.error('Failed to create default users:', error);
            throw error;
        }
    }

    // Create default habits for all users
    async createDefaultHabits() {
        try {
            console.log('Creating default habits...');
            
            const users = await this.dataManager.getAllUsers();
            
            for (const user of users) {
                for (const habitData of this.defaultHabits) {
                    await this.dataManager.createHabit({
                        userId: user.ID,
                        ...habitData
                    });
                }
                console.log(`Created habits for user: ${user.Name}`);
            }
            
        } catch (error) {
            console.error('Failed to create default habits:', error);
            throw error;
        }
    }

    // Create default tasks for all users
    async createDefaultTasks() {
        try {
            console.log('Creating default tasks...');
            
            const users = await this.dataManager.getAllUsers();
            
            for (const user of users) {
                for (const taskData of this.defaultTasks) {
                    await this.dataManager.createTask({
                        userId: user.ID,
                        ...taskData
                    });
                }
                console.log(`Created tasks for user: ${user.Name}`);
            }
            
        } catch (error) {
            console.error('Failed to create default tasks:', error);
            throw error;
        }
    }

    // Create default user settings for all users
    async createDefaultUserSettings() {
        try {
            console.log('Creating default user settings...');
            
            const users = await this.dataManager.getAllUsers();
            
            for (const user of users) {
                for (const settingsData of this.defaultUserSettings) {
                    await this.dataManager.createUserSettings({
                        userId: user.ID,
                        ...settingsData
                    });
                }
                console.log(`Created settings for user: ${user.Name}`);
            }
            
        } catch (error) {
            console.error('Failed to create default user settings:', error);
            throw error;
        }
    }

    // Create sample daily records for the past 30 days
    async createSampleDailyRecords() {
        try {
            console.log('Creating sample daily records...');
            
            const users = await this.dataManager.getAllUsers();
            const today = new Date();
            
            for (const user of users) {
                for (let i = 0; i < 30; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    // Generate random completion data
                    const physics = Math.random() > 0.3; // 70% completion
                    const additionalSubject = Math.random() > 0.35; // 65% completion
                    const exercise = Math.random() > 0.25; // 75% completion
                    const wakeUp = Math.random() > 0.2; // 80% completion
                    const screenControl = Math.random() > 0.4; // 60% completion
                    
                    const validDay = physics && additionalSubject && exercise && wakeUp && screenControl;
                    const tasksCompleted = [physics, additionalSubject, exercise, wakeUp, screenControl].filter(Boolean).length;
                    
                    await this.dataManager.createDailyRecord({
                        userId: user.ID,
                        date: dateStr,
                        tasksCompleted: tasksCompleted,
                        tasksTotal: 5,
                        habitsCompleted: validDay ? 5 : tasksCompleted,
                        habitsTotal: 5,
                        productivity: Math.round((tasksCompleted / 5) * 100),
                        mood: validDay ? 'excellent' : (tasksCompleted >= 3 ? 'good' : 'needs_improvement'),
                        notes: validDay ? 'Perfect day! All habits completed!' : `${tasksCompleted}/5 tasks completed`,
                        tasksSubmitted: true,
                        physics: physics,
                        additional_subject_chemistrymaths: additionalSubject,
                        exercise: exercise,
                        wake_up: wakeUp,
                        screen_control: screenControl,
                        valid_day: validDay
                    });
                }
                console.log(`Created daily records for user: ${user.Name}`);
            }
            
        } catch (error) {
            console.error('Failed to create sample daily records:', error);
            throw error;
        }
    }

    // Reset all data (for testing purposes)
    async resetAllData() {
        try {
            console.log('Resetting all data...');
            
            // Clear all sheets
            await this.dataManager.clearSheet('Users');
            await this.dataManager.clearSheet('DailyRecords');
            await this.dataManager.clearSheet('Tasks');
            await this.dataManager.clearSheet('Habits');
            await this.dataManager.clearSheet('UserSettings');
            
            // Re-setup headers
            await this.dataManager.setupSheetHeaders();
            
            // Re-initialize default data
            await this.initializeAllDefaults();
            
            console.log('All data reset successfully');
            
        } catch (error) {
            console.error('Failed to reset all data:', error);
            throw error;
        }
    }

    // Get initialization status
    async getInitializationStatus() {
        try {
            const users = await this.dataManager.getAllUsers();
            const dailyRecords = await this.dataManager.getDailyRecords();
            const tasks = await this.dataManager.getTasks();
            
            return {
                hasUsers: users.length > 0,
                hasDailyRecords: dailyRecords.length > 0,
                hasTasks: tasks.length > 0,
                userCount: users.length,
                dailyRecordCount: dailyRecords.length,
                taskCount: tasks.length,
                isInitialized: users.length > 0 && dailyRecords.length > 0
            };
            
        } catch (error) {
            console.error('Failed to get initialization status:', error);
            return {
                hasUsers: false,
                hasDailyRecords: false,
                hasTasks: false,
                userCount: 0,
                dailyRecordCount: 0,
                taskCount: 0,
                isInitialized: false
            };
        }
    }
}

// Make available globally
window.DefaultDataInitializer = DefaultDataInitializer;

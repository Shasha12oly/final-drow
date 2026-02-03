// Google OAuth with JSON File Storage
// Combines Google authentication with file-based database

class GoogleAuthWithFileStorage {
    constructor() {
        this.db = new FileDatabase();
        this.currentUser = null;
        this.isInitialized = false;
        this.googleClientId = '280189100786-8phabqt4mjjo792u7b4bkhf4tg6qn6rj.apps.googleusercontent.com';
    }

    // Initialize Google OAuth and file storage
    async init() {
        try {
            // Initialize file database
            this.db.init();
            
            // Initialize Google OAuth
            await this.initGoogleOAuth();
            
            this.isInitialized = true;
            console.log('Google Auth with File Storage initialized');
        } catch (error) {
            console.error('Failed to initialize:', error);
            throw error;
        }
    }

    // Initialize Google OAuth
    async initGoogleOAuth() {
        return new Promise((resolve, reject) => {
            // Load Google Identity Services
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.initialize({
                    client_id: this.googleClientId,
                    callback: this.handleGoogleSignIn.bind(this),
                    auto_select: false,
                    cancel_on_tap_outside: false
                });
                resolve();
            } else {
                // Load Google Identity Services script
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.onload = () => {
                    google.accounts.id.initialize({
                        client_id: this.googleClientId,
                        callback: this.handleGoogleSignIn.bind(this),
                        auto_select: false,
                        cancel_on_tap_outside: false
                    });
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            }
        });
    }

    // Handle Google Sign-In
    async handleGoogleSignIn(response) {
        try {
            console.log('Google Sign-In successful');
            
            // Decode JWT token
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            // Create user object
            const user = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                isGoogleUser: true,
                signedUpAt: new Date().toISOString()
            };
            
            // Store user in file database
            await this.createUser(user);
            
            // Set as current user
            this.currentUser = user;
            
            // Store session
            localStorage.setItem('googleCredential', response.credential);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            console.log('User authenticated and stored:', user);
            
            // Redirect to dashboard
            window.location.href = 'dashboard-pro.html';
            
        } catch (error) {
            console.error('Google Sign-In error:', error);
            throw error;
        }
    }

    // Create user in file database
    async createUser(userData) {
        try {
            // Check if user already exists
            let existingUser = this.db.getUser(userData.id);
            
            if (!existingUser) {
                // Create new user
                existingUser = this.db.createUser({
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    picture: userData.picture,
                    isGoogleUser: userData.isGoogleUser,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log('Created new user in file database');
            } else {
                // Update existing user
                existingUser = this.db.updateUser(userData.id, {
                    name: userData.name,
                    picture: userData.picture,
                    lastLogin: new Date().toISOString()
                });
                console.log('Updated existing user in file database');
            }
            
            return existingUser;
        } catch (error) {
            console.error('Failed to create user:', error);
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
        try {
            // Clear Google session
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.disableAutoSelect();
            }
            
            // Clear local storage
            localStorage.removeItem('googleCredential');
            localStorage.removeItem('currentUser');
            
            // Clear current user
            this.currentUser = null;
            
            console.log('User signed out');
        } catch (error) {
            console.error('Failed to sign out:', error);
        }
    }

    // Restore session from localStorage
    async restoreSession() {
        try {
            const savedUser = localStorage.getItem('currentUser');
            const savedCredential = localStorage.getItem('googleCredential');
            
            if (savedUser && savedCredential) {
                const user = JSON.parse(savedUser);
                
                // Verify user exists in file database
                const dbUser = this.db.getUser(user.id);
                if (dbUser) {
                    this.currentUser = dbUser;
                    console.log('Session restored for user:', user.name);
                    return true;
                } else {
                    // User not found in database, clear session
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('googleCredential');
                }
            }
            
            return false;
        } catch (error) {
            console.error('Failed to restore session:', error);
            return false;
        }
    }

    // Render Google Sign-In button
    renderSignInButton(elementId) {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.renderButton(
                document.getElementById(elementId),
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'signup_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    width: 400
                }
            );
        } else {
            console.error('Google Identity Services not loaded');
        }
    }

    // Display Google Sign-In button (fallback)
    displaySignInButton(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div id="google-signin-btn" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 24px;
                    background: white;
                    border: 2px solid #dadce0;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    color: #3c4043;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="window.googleAuthWithFileStorage.init().then(() => window.googleAuthWithFileStorage.renderSignInButton('google-signin-btn'))">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                </div>
            `;
        }
    }

    // Delegate file database methods
    async createDailyRecord(recordData) {
        return this.db.createDailyRecord({
            userId: this.currentUser.id,
            ...recordData
        });
    }

    async getDailyRecord(date) {
        return this.db.getDailyRecord(date);
    }

    async getDailyRecords(startDate, endDate) {
        return this.db.getDailyRecords(startDate, endDate);
    }

    async updateDailyRecord(recordId, updateData) {
        return this.db.updateDailyRecord(recordId, updateData);
    }

    async createTask(taskData) {
        return this.db.createTask({
            userId: this.currentUser.id,
            ...taskData
        });
    }

    async getTasks() {
        const allTasks = this.db.getTasks();
        return allTasks.filter(task => task.userId === this.currentUser.id);
    }

    async updateTask(taskId, updateData) {
        return this.db.updateTask(taskId, updateData);
    }

    async deleteTask(taskId) {
        return this.db.deleteTask(taskId);
    }

    async createHabit(habitData) {
        return this.db.createHabit({
            userId: this.currentUser.id,
            ...habitData
        });
    }

    async getHabits() {
        const allHabits = this.db.getHabits();
        return allHabits.filter(habit => habit.userId === this.currentUser.id);
    }

    async createUserSettings(settingsData) {
        return this.db.createUserSettings({
            userId: this.currentUser.id,
            ...settingsData
        });
    }

    async getUserSettings() {
        return this.db.getUserSettings(this.currentUser.id);
    }

    // Export data
    async exportData() {
        return this.db.exportAllData();
    }

    // Import data
    async importData(data) {
        return this.db.importData(data);
    }

    // Get statistics
    async getStats(days = 30) {
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
            
            return {
                totalDays: dailyRecords.length,
                completedTasks: tasks.filter(task => task.status === 'completed').length,
                totalTasks: tasks.length,
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
}

// Make available globally
window.GoogleAuthWithFileStorage = GoogleAuthWithFileStorage;

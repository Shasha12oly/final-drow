// User Data Manager - Handles all user data, streaks, and analytics
class UserDataManager {
    constructor() {
        this.currentUser = null;
        this.habitData = [];
        this.initializeData();
    }

    // Initialize data from localStorage
    initializeData() {
        try {
            // Load current user
            const savedUser = localStorage.getItem('googleUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }

            // Load habit data
            const savedData = localStorage.getItem('growthTrackerData');
            if (savedData) {
                this.habitData = JSON.parse(savedData);
            } else {
                // Initialize with sample data
                this.initializeSampleData();
            }
        } catch (error) {
            console.error('Error initializing user data:', error);
            this.initializeSampleData();
        }
    }

    // Initialize sample data for new users
    initializeSampleData() {
        const today = new Date();
        const sampleData = [];

        // Generate last 30 days of sample data
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = Math.random() > 0.3; // 70% completion rate
            
            sampleData.push({
                date: dateStr,
                habits: {
                    'Morning Exercise': isCompleted && Math.random() > 0.2,
                    'Read for 30 mins': isCompleted && Math.random() > 0.15,
                    'Meditate': isCompleted && Math.random() > 0.25,
                    'Healthy Breakfast': isCompleted && Math.random() > 0.1,
                    'Code Practice': isCompleted && Math.random() > 0.3
                },
                mood: isCompleted ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 3) + 1,
                notes: isCompleted ? 'Great day!' : 'Could do better'
            });
        }

        this.habitData = sampleData;
        this.saveData();
    }

    // Save data to localStorage
    saveData() {
        try {
            localStorage.setItem('growthTrackerData', JSON.stringify(this.habitData));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Update user info display
    updateUserDisplay() {
        if (!this.currentUser) return;

        // Update user name
        const userNameElements = document.querySelectorAll('#userName, .user-name');
        userNameElements.forEach(element => {
            if (element) element.textContent = this.currentUser.name;
        });

        // Update user avatar
        const userAvatarElements = document.querySelectorAll('#userAvatar, .user-avatar');
        userAvatarElements.forEach(element => {
            if (element) {
                if (this.currentUser.picture) {
                    element.style.backgroundImage = `url(${this.currentUser.picture})`;
                    element.style.backgroundSize = 'cover';
                    element.style.backgroundPosition = 'center';
                    element.textContent = '';
                } else {
                    const initials = this.currentUser.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                    element.textContent = initials;
                }
            }
        });

        // Update user email
        const userEmailElements = document.querySelectorAll('#userEmail, .user-email');
        userEmailElements.forEach(element => {
            if (element) element.textContent = this.currentUser.email;
        });
    }

    // Calculate current streak
    getCurrentStreak() {
        if (this.habitData.length === 0) return 0;

        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        
        // Sort data by date
        const sortedData = [...this.habitData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        for (let i = 0; i < sortedData.length; i++) {
            const dayData = sortedData[i];
            const habits = Object.values(dayData.habits || {});
            const completedHabits = habits.filter(Boolean).length;
            const totalHabits = habits.length;
            
            // Consider day complete if 80% of habits are done
            if (totalHabits > 0 && completedHabits / totalHabits >= 0.8) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    // Get longest streak
    getLongestStreak() {
        if (this.habitData.length === 0) return 0;

        let longestStreak = 0;
        let currentStreak = 0;
        
        const sortedData = [...this.habitData].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (const dayData of sortedData) {
            const habits = Object.values(dayData.habits || {});
            const completedHabits = habits.filter(Boolean).length;
            const totalHabits = habits.length;
            
            if (totalHabits > 0 && completedHabits / totalHabits >= 0.8) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return longestStreak;
    }

    // Get total days tracked
    getTotalDaysTracked() {
        return this.habitData.length;
    }

    // Get completion rate
    getCompletionRate() {
        if (this.habitData.length === 0) return 0;

        let totalHabits = 0;
        let completedHabits = 0;

        for (const dayData of this.habitData) {
            const habits = Object.values(dayData.habits || {});
            totalHabits += habits.length;
            completedHabits += habits.filter(Boolean).length;
        }

        return totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
    }

    // Get habit statistics
    getHabitStats() {
        const habitStats = {};
        
        for (const dayData of this.habitData) {
            for (const [habitName, completed] of Object.entries(dayData.habits || {})) {
                if (!habitStats[habitName]) {
                    habitStats[habitName] = { total: 0, completed: 0 };
                }
                habitStats[habitName].total++;
                if (completed) {
                    habitStats[habitName].completed++;
                }
            }
        }

        // Convert to percentages
        for (const habitName in habitStats) {
            const stats = habitStats[habitName];
            stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        }

        return habitStats;
    }

    // Get mood data for analytics
    getMoodData() {
        return this.habitData.map(day => ({
            date: day.date,
            mood: day.mood || 3
        }));
    }

    // Get completion data for charts
    getCompletionData() {
        return this.habitData.map(day => {
            const habits = Object.values(day.habits || {});
            const completed = habits.filter(Boolean).length;
            const total = habits.length;
            
            return {
                date: day.date,
                completion: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });
    }

    // Add today's data
    addTodayData(habits, mood = null, notes = '') {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if today's data already exists
        const existingIndex = this.habitData.findIndex(day => day.date === today);
        
        const todayData = {
            date: today,
            habits: habits,
            mood: mood,
            notes: notes
        };

        if (existingIndex >= 0) {
            this.habitData[existingIndex] = todayData;
        } else {
            this.habitData.push(todayData);
        }

        this.saveData();
    }

    // Get badges data
    getBadgesData() {
        const currentStreak = this.getCurrentStreak();
        const longestStreak = this.getLongestStreak();
        const totalDays = this.getTotalDaysTracked();
        const completionRate = this.getCompletionRate();

        return {
            currentStreak,
            longestStreak,
            totalDays,
            completionRate,
            badges: this.calculateBadges(currentStreak, longestStreak, totalDays, completionRate)
        };
    }

    // Calculate earned badges
    calculateBadges(currentStreak, longestStreak, totalDays, completionRate) {
        const badges = [];

        // Streak badges
        if (currentStreak >= 7) badges.push({ name: 'Week Warrior', type: 'gold', earned: true });
        if (currentStreak >= 30) badges.push({ name: 'Month Warrior', type: 'gold', earned: true });
        if (longestStreak >= 100) badges.push({ name: 'Century Club', type: 'platinum', earned: true });

        // Consistency badges
        if (completionRate >= 90) badges.push({ name: 'Habit Master', type: 'gold', earned: true });
        if (completionRate >= 80) badges.push({ name: 'Consistent', type: 'silver', earned: true });

        // Milestone badges
        if (totalDays >= 30) badges.push({ name: 'Monthly Tracker', type: 'silver', earned: true });
        if (totalDays >= 100) badges.push({ name: 'Century Tracker', type: 'gold', earned: true });

        return badges;
    }
}

// Global instance
window.userDataManager = new UserDataManager();

// Auto-update user display when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.userDataManager.updateUserDisplay();
});

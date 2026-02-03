// File-based Analytics System for Growth Tracker
// Simplified analytics for file-based database

class FileAnalytics {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.habitWeights = {
            physics: 2.0,
            additional_subject_chemistrymaths: 2.0,
            exercise: 1.5,
            wake_up: 1.0,
            screen_control: 1.0
        };
        this.habitNames = {
            physics: 'Physics',
            additional_subject_chemistrymaths: 'Additional Subject',
            exercise: 'Exercise',
            wake_up: 'Wake Up',
            screen_control: 'Screen Control'
        };
    }

    // Get comprehensive user statistics
    async getUserStats(userId, days = 30) {
        try {
            const dailyRecords = await this.dataManager.getDailyRecords(
                this.getDateRange(days).startDate,
                this.getDateRange(days).endDate
            );
            
            const tasks = await this.dataManager.getTasks();
            const userTasks = tasks.filter(task => task.userId === userId);
            
            return {
                totalDays: dailyRecords.length,
                totalScore: this.calculateTotalScore(dailyRecords),
                averageScore: this.calculateAverageScore(dailyRecords),
                currentStreak: await this.calculateCurrentStreak(),
                longestStreak: await this.calculateLongestStreak(),
                habitCompletion: this.calculateHabitCompletionRates(dailyRecords),
                weeklyProgress: this.calculateWeeklyProgress(dailyRecords),
                monthlyTrend: this.calculateMonthlyTrend(dailyRecords),
                rank: await this.calculateUserRank(userId),
                totalUsers: await this.getTotalUsersCount()
            };
        } catch (error) {
            console.error('Failed to get user stats:', error);
            return null;
        }
    }

    // Calculate total weighted score
    calculateTotalScore(dailyRecords) {
        return dailyRecords.reduce((total, record) => {
            return total + this.calculateDailyScore(record);
        }, 0);
    }

    // Calculate average score
    calculateAverageScore(dailyRecords) {
        if (dailyRecords.length === 0) return 0;
        return this.calculateTotalScore(dailyRecords) / dailyRecords.length;
    }

    // Calculate daily weighted score
    calculateDailyScore(record) {
        let score = 0;
        for (const [habit, weight] of Object.entries(this.habitWeights)) {
            if (record[habit] === true) {
                score += weight;
            }
        }
        return score;
    }

    // Calculate current streak
    async calculateCurrentStreak() {
        try {
            const dailyRecords = await this.dataManager.getDailyRecords();
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
                    // Check if it's a valid day (all required tasks completed)
                    const isValidDay = this.isValidDay(dailyRecord);
                    
                    if (isValidDay) {
                        streak++;
                        missingInARow = 0;
                    } else {
                        // Logged but invalid -> break streak immediately
                        break;
                    }
                } else {
                    // Missing day
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

    // Calculate longest streak in history
    async calculateLongestStreak() {
        try {
            const dailyRecords = await this.dataManager.getDailyRecords();
            
            if (dailyRecords.length === 0) return 0;
            
            // Sort by date
            dailyRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let longestStreak = 0;
            let currentStreak = 0;
            let missingInARow = 0;
            const mercyDays = 2;
            
            for (let i = 0; i < dailyRecords.length; i++) {
                const record = dailyRecords[i];
                const isValidDay = this.isValidDay(record);
                
                if (isValidDay) {
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

    // Check if a day is valid (all habits completed)
    isValidDay(record) {
        const requiredHabits = ['physics', 'additional_subject_chemistrymaths', 'exercise', 'wake_up', 'screen_control'];
        return requiredHabits.every(habit => record[habit] === true);
    }

    // Calculate habit completion rates
    calculateHabitCompletionRates(dailyRecords) {
        const habitStats = {};
        
        // Initialize stats
        for (const habit of Object.keys(this.habitNames)) {
            habitStats[habit] = {
                completed: 0,
                total: dailyRecords.length,
                rate: 0
            };
        }
        
        // Count completions
        dailyRecords.forEach(record => {
            for (const habit of Object.keys(this.habitNames)) {
                if (record[habit] === true) {
                    habitStats[habit].completed++;
                }
            }
        });
        
        // Calculate rates
        for (const habit of Object.keys(habitStats)) {
            const stats = habitStats[habit];
            stats.rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        }
        
        return habitStats;
    }

    // Calculate weekly progress
    calculateWeeklyProgress(dailyRecords) {
        const weeklyData = {};
        
        dailyRecords.forEach(record => {
            const date = new Date(record.date);
            const weekNumber = this.getWeekNumber(date);
            const year = date.getFullYear();
            const weekKey = `${year}-W${weekNumber}`;
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    week: weekKey,
                    totalScore: 0,
                    days: 0,
                    validDays: 0
                };
            }
            
            weeklyData[weekKey].totalScore += this.calculateDailyScore(record);
            weeklyData[weekKey].days++;
            if (this.isValidDay(record)) {
                weeklyData[weekKey].validDays++;
            }
        });
        
        return Object.values(weeklyData);
    }

    // Calculate monthly trend
    calculateMonthlyTrend(dailyRecords) {
        const monthlyData = {};
        
        dailyRecords.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    totalScore: 0,
                    days: 0,
                    validDays: 0
                };
            }
            
            monthlyData[monthKey].totalScore += this.calculateDailyScore(record);
            monthlyData[monthKey].days++;
            if (this.isValidDay(record)) {
                monthlyData[monthKey].validDays++;
            }
        });
        
        return Object.values(monthlyData);
    }

    // Get user rank among all users
    async calculateUserRank(userId) {
        try {
            const allUsers = await this.dataManager.getAllUsers();
            const userStats = [];
            
            for (const user of allUsers) {
                const stats = await this.getUserStats(user.id, 7); // Last 7 days
                if (stats && stats.totalDays > 0) {
                    userStats.push({
                        userId: user.id,
                        username: user.name,
                        totalScore: stats.totalScore,
                        averageScore: stats.averageScore,
                        daysLogged: stats.totalDays,
                        validDays: stats.weeklyProgress.reduce((sum, week) => sum + week.validDays, 0)
                    });
                }
            }
            
            // Sort by total score
            userStats.sort((a, b) => b.totalScore - a.totalScore);
            
            // Add ranks
            userStats.forEach((user, index) => {
                user.rank = index + 1;
            });
            
            const userRank = userStats.find(user => user.userId === userId);
            return userRank ? userRank.rank : null;
        } catch (error) {
            console.error('Failed to calculate user rank:', error);
            return null;
        }
    }

    // Get total users count
    async getTotalUsersCount() {
        try {
            const allUsers = await this.dataManager.getAllUsers();
            return allUsers.length;
        } catch (error) {
            console.error('Failed to get total users count:', error);
            return 0;
        }
    }

    // Get data for radar chart
    async getRadarChartData(userId) {
        try {
            const stats = await this.getUserStats(userId, 30);
            if (!stats) return null;
            
            const habitAverages = [];
            for (const [habitKey, habitName] of Object.entries(this.habitNames)) {
                const habitStats = stats.habitCompletion[habitKey];
                habitAverages.push({
                    habit: habitName,
                    average: habitStats.rate / 100, // Convert to 0-1 scale
                    completed: habitStats.completed,
                    total: habitStats.total
                });
            }
            
            return habitAverages;
        } catch (error) {
            console.error('Failed to get radar chart data:', error);
            return null;
        }
    }

    // Helper functions
    getDateRange(days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
}

// Make available globally
window.FileAnalytics = FileAnalytics;

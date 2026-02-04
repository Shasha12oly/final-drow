// Advanced Analytics System for Growth Tracker
// Replaces CSV-based analysis with direct database integration

class GrowthAnalytics {
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
                currentStreak: await this.calculateCurrentStreak(userId),
                longestStreak: await this.calculateLongestStreak(userId),
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

    // Calculate current streak (same logic as CSV analysis)
    async calculateCurrentStreak(userId) {
        try {
            const dailyRecords = await this.dataManager.getDailyRecords();
            const userRecords = dailyRecords.filter(record => record.userId === userId);
            
            if (userRecords.length === 0) return 0;
            
            // Sort by date
            userRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const today = new Date();
            let streak = 0;
            let missingInARow = 0;
            const mercyDays = 2;
            
            // Walk backwards from today
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const dailyRecord = userRecords.find(record => record.date === dateStr);
                
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
    async calculateLongestStreak(userId) {
        try {
            const dailyRecords = await this.dataManager.getDailyRecords();
            const userRecords = dailyRecords.filter(record => record.userId === userId);
            
            if (userRecords.length === 0) return 0;
            
            // Sort by date
            userRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let longestStreak = 0;
            let currentStreak = 0;
            let missingInARow = 0;
            const mercyDays = 2;
            
            for (let i = 0; i < userRecords.length; i++) {
                const record = userRecords[i];
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

    // Get weekly league table
    async getWeeklyLeague() {
        try {
            const allUsers = await this.dataManager.getAllUsers();
            const weeklyData = [];
            
            for (const user of allUsers) {
                const stats = await this.getUserStats(user.id, 7); // Last 7 days
                if (stats && stats.totalDays > 0) {
                    weeklyData.push({
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
            weeklyData.sort((a, b) => b.totalScore - a.totalScore);
            
            // Add ranks
            weeklyData.forEach((user, index) => {
                user.rank = index + 1;
            });
            
            return weeklyData;
        } catch (error) {
            console.error('Failed to get weekly league:', error);
            return [];
        }
    }

    // Get user rank among all users
    async calculateUserRank(userId) {
        try {
            const weeklyLeague = await this.getWeeklyLeague();
            const userRank = weeklyLeague.find(user => user.userId === userId);
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

    // Generate individual report data
    async generateIndividualReport(userId) {
        try {
            const user = await this.dataManager.getUser(userId);
            const stats = await this.getUserStats(userId, 30);
            
            if (!user || !stats) {
                throw new Error('User or stats not found');
            }
            
            return {
                user: {
                    name: user.name,
                    email: user.email,
                    joinedAt: user.createdAt
                },
                stats: stats,
                habitAverages: stats.habitCompletion,
                weeklyProgress: stats.weeklyProgress,
                monthlyTrend: stats.monthlyTrend,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to generate individual report:', error);
            return null;
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

    // Get heatmap data for habit visualization
    async getHeatmapData(userId, days = 30) {
        try {
            const dailyRecords = await this.dataManager.getDailyRecords(
                this.getDateRange(days).startDate,
                this.getDateRange(days).endDate
            );
            
            const userRecords = dailyRecords.filter(record => record.userId === userId);
            const heatmapData = [];
            
            userRecords.forEach(record => {
                const dayData = {
                    date: record.date,
                    dayName: new Date(record.date).toLocaleDateString('en', { weekday: 'short' }),
                    habits: {}
                };
                
                for (const [habitKey, habitName] of Object.entries(this.habitNames)) {
                    dayData.habits[habitKey] = {
                        name: habitName,
                        completed: record[habitKey] === true,
                        value: record[habitKey] === true ? 1 : 0
                    };
                }
                
                heatmapData.push(dayData);
            });
            
            return heatmapData;
        } catch (error) {
            console.error('Failed to get heatmap data:', error);
            return [];
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

    // Export data for backup/migration
    async exportUserData(userId) {
        try {
            const user = await this.dataManager.getUser(userId);
            const dailyRecords = await this.dataManager.getDailyRecords();
            const tasks = await this.dataManager.getTasks();
            
            const userRecords = dailyRecords.filter(record => record.userId === userId);
            const userTasks = tasks.filter(task => task.userId === userId);
            
            return {
                user: user,
                dailyRecords: userRecords,
                tasks: userTasks,
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to export user data:', error);
            return null;
        }
    }
}

// Make available globally
window.GrowthAnalytics = GrowthAnalytics;

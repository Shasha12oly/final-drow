// Auto-save default tasks to Google Sheets
class DefaultTasksSaver {
    constructor(dataManager) {
        this.dataManager = dataManager;
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
                title: 'Mathematics Practice',
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
            },
            {
                title: 'Read Technical Book',
                category: 'Academic',
                priority: 'medium',
                status: 'pending'
            },
            {
                title: 'Meditation',
                category: 'Health',
                priority: 'low',
                status: 'pending'
            },
            {
                title: 'Review Notes',
                category: 'Academic',
                priority: 'medium',
                status: 'pending'
            },
            {
                title: 'Plan Tomorrow',
                category: 'Discipline',
                priority: 'low',
                status: 'pending'
            }
        ];
    }

    // Check if tasks already exist for today
    async checkTodayTasks() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const tasks = await this.dataManager.getTasks();
            
            // Filter tasks created today
            const todayTasks = tasks.filter(task => 
                task.CreatedAt && task.CreatedAt.startsWith(today)
            );
            
            return todayTasks.length > 0;
        } catch (error) {
            console.error('Failed to check today\'s tasks:', error);
            return false;
        }
    }

    // Save default tasks to Google Sheets
    async saveDefaultTasks() {
        try {
            console.log('Saving default tasks to Google Sheets...');
            
            // Check if tasks already exist for today
            const hasTodayTasks = await this.checkTodayTasks();
            if (hasTodayTasks) {
                console.log('Tasks already exist for today, skipping...');
                return false;
            }

            // Get current user
            const currentUser = this.dataManager.getCurrentUser();
            if (!currentUser) {
                console.log('No current user found, skipping task creation');
                return false;
            }

            // Save each default task
            let savedCount = 0;
            for (const taskData of this.defaultTasks) {
                try {
                    await this.dataManager.createTask({
                        userId: currentUser.ID,
                        ...taskData
                    });
                    savedCount++;
                    console.log(`Saved task: ${taskData.title}`);
                } catch (error) {
                    console.error(`Failed to save task ${taskData.title}:`, error);
                }
            }

            console.log(`Successfully saved ${savedCount} default tasks to Google Sheets`);
            return savedCount > 0;
            
        } catch (error) {
            console.error('Failed to save default tasks:', error);
            return false;
        }
    }

    // Get current tasks from Google Sheets
    async getCurrentTasks() {
        try {
            const tasks = await this.dataManager.getTasks();
            const currentUser = this.dataManager.getCurrentUser();
            
            if (!currentUser) {
                return [];
            }

            // Filter tasks for current user
            const userTasks = tasks.filter(task => task.UserID === currentUser.ID);
            
            // Sort by priority and creation date
            return userTasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.Priority] || 0;
                const bPriority = priorityOrder[b.Priority] || 0;
                
                if (aPriority !== bPriority) {
                    return bPriority - aPriority; // High priority first
                }
                
                // Same priority, sort by creation date
                return new Date(b.CreatedAt) - new Date(a.CreatedAt);
            });
            
        } catch (error) {
            console.error('Failed to get current tasks:', error);
            return [];
        }
    }

    // Update task status
    async updateTaskStatus(taskId, status) {
        try {
            const updateData = {
                Status: status,
                UpdatedAt: new Date().toISOString()
            };
            
            if (status === 'completed') {
                updateData.CompletedAt = new Date().toISOString();
            }
            
            await this.dataManager.updateTask(taskId, updateData);
            console.log(`Updated task ${taskId} status to ${status}`);
            return true;
            
        } catch (error) {
            console.error('Failed to update task status:', error);
            return false;
        }
    }

    // Delete task
    async deleteTask(taskId) {
        try {
            await this.dataManager.deleteTask(taskId);
            console.log(`Deleted task ${taskId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete task:', error);
            return false;
        }
    }

    // Get task statistics
    async getTaskStats() {
        try {
            const tasks = await this.getCurrentTasks();
            
            const stats = {
                total: tasks.length,
                completed: tasks.filter(t => t.Status === 'completed').length,
                pending: tasks.filter(t => t.Status === 'pending').length,
                high: tasks.filter(t => t.Priority === 'high').length,
                medium: tasks.filter(t => t.Priority === 'medium').length,
                low: tasks.filter(t => t.Priority === 'low').length,
                byCategory: {}
            };
            
            // Group by category
            tasks.forEach(task => {
                if (!stats.byCategory[task.Category]) {
                    stats.byCategory[task.Category] = { total: 0, completed: 0 };
                }
                stats.byCategory[task.Category].total++;
                if (task.Status === 'completed') {
                    stats.byCategory[task.Category].completed++;
                }
            });
            
            return stats;
            
        } catch (error) {
            console.error('Failed to get task stats:', error);
            return null;
        }
    }
}

// Make available globally
window.DefaultTasksSaver = DefaultTasksSaver;

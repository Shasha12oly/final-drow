// Growth Tracker Pro - Theme Switcher for Professional Design

// Prevent duplicate declaration
if (typeof window.ThemeManager === 'undefined') {
    class ThemeManager {
        constructor() {
            this.currentTheme = localStorage.getItem('selectedTheme') || 'light';
            this.init();
        }

    init() {
        this.createThemeSelector();
        this.applyTheme(this.currentTheme);
        this.setupKeyboardShortcuts();
        this.setupAutoTheme();
        this.updateThemeIcon();
    }

    createThemeSelector() {
        // Check if selector already exists
        if (document.querySelector('.theme-selector')) {
            return;
        }

        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <button id="theme-toggle" class="theme-toggle">
                <i class="fas fa-lightbulb"></i>
            </button>
        `;

        document.body.appendChild(selector);

        // Add event listener
        const toggle = document.getElementById('theme-toggle');
        toggle.addEventListener('click', () => {
            this.nextTheme();
        });

        // Set current theme icon
        this.updateThemeIcon();
    }

    switchTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        this.showNotification(theme);
        this.updateThemeIcon();
    }

    applyTheme(theme) {
        // Remove all theme attributes
        document.documentElement.removeAttribute('data-theme');
        
        // Apply new theme
        if (theme !== 'light') {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Update selector
        const select = document.getElementById('theme-select');
        if (select) {
            select.value = theme;
        }

        // Update CSS variables
        this.updateCSSVariables(theme);
    }

    updateCSSVariables(theme) {
        const root = document.documentElement;
        
        // Theme configurations
        const themes = {
            light: {
                primary: '#4f46e5',
                secondary: '#06b6d4',
                background: '#ffffff',
                surface: '#f8fafc',
                text: '#1e293b',
                textSecondary: '#64748b'
            },
            dark: {
                primary: '#4f46e5',
                secondary: '#06b6d4',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f8fafc',
                textSecondary: '#cbd5e1'
            }
        };

        const config = themes[theme];
        if (config) {
            Object.entries(config).forEach(([key, value]) => {
                root.style.setProperty(`--theme-${key}`, value);
            });
        }
    }

    saveTheme(theme) {
        localStorage.setItem('selectedTheme', theme);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + number keys for theme switching
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTheme('light');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTheme('dark');
                        break;
                }
            }
        });
    }

    setupAutoTheme() {
        // Auto-switch based on time of day
        const hour = new Date().getHours();
        let autoTheme = 'light';

        if (hour >= 18 || hour < 6) {
            autoTheme = 'dark';
        } else if (hour >= 6 && hour < 12) {
            autoTheme = 'light';
        } else if (hour >= 12 && hour < 18) {
            autoTheme = 'light';
        }

        // Only apply auto-theme if user hasn't manually selected one
        if (!localStorage.getItem('selectedTheme')) {
            this.switchTheme(autoTheme);
        }
    }

    showNotification(theme) {
        // Remove existing notification
        const existing = document.querySelector('.theme-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getThemeIcon(theme)}</span>
                <span class="notification-text">Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        const icon = notification.querySelector('.notification-icon');
        icon.style.cssText = `
            font-size: 1.2rem;
        `;

        const text = notification.querySelector('.notification-text');
        text.style.cssText = `
            font-weight: 500;
            color: #374151;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    getThemeIcon(theme) {
        const icons = {
            light: '☀️',
            dark: '🌙'
        };
        return icons[theme] || '🎨';
    }

    updateThemeIcon() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (this.currentTheme === 'dark') {
                icon.className = 'fas fa-lightbulb';
                toggle.title = 'Switch to Light Theme';
            } else {
                icon.className = 'far fa-lightbulb';
                toggle.title = 'Switch to Dark Theme';
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getRandomTheme() {
        const themes = ['light', 'dark'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        return themes[nextIndex];
    }

    nextTheme() {
        const next = this.getRandomTheme();
        this.switchTheme(next);
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.ThemeManager !== 'undefined') {
        window.themeManager = new ThemeManager();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

// Close the if statement for preventing duplicate declaration
}

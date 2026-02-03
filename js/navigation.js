// Growth Tracker Pro - Navigation System

class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.mobileMenuClose = document.getElementById('mobileMenuClose');
        this.userMenu = document.getElementById('userMenu');
        this.userMenuToggle = document.getElementById('userMenuToggle');
        
        this.setupEventListeners();
        this.setupThemeIntegration();
        this.setupAuthenticationGuard();
        this.refreshUserUI();
    }

    setupEventListeners() {
        this.setupMobileMenu();
        this.setupActiveNavigation();
        this.setupUserMenu();
    }

    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const mobileClose = document.getElementById('mobileMenuClose');
        const mobileMenu = document.getElementById('mobileMenu');

        if (mobileToggle && mobileClose && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileMenu.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            mobileClose.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });

            // Close menu when clicking on links
            const mobileLinks = mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    }

    setupAuthenticationGuard() {
        // Check if user is authenticated
        const user = localStorage.getItem('googleUser');
        
        // Get all navigation links
        const navLinks = document.querySelectorAll('.main-header-link, .mobile-menu-nav a, .sidebar-nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            // Allow these links for unauthenticated users
            const allowedLinks = ['/', '/signup-pro.html', 'signup-pro.html'];
            const isAllowed = allowedLinks.includes(href) || href.includes('signup-pro.html');
            
            if (!user && !isAllowed) {
                // Prevent default click behavior
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Show authentication required popup
                    this.showAuthRequiredPopup();
                });
                
                // Add visual indication that link is disabled
                link.style.opacity = '0.6';
                link.style.cursor = 'not-allowed';
                link.title = 'Sign in required';
            }
        });
    }

    showAuthRequiredPopup() {
        // Remove existing popup if any
        const existingPopup = document.getElementById('nav-auth-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup
        const popup = document.createElement('div');
        popup.id = 'nav-auth-popup';
        popup.innerHTML = `
            <div class="nav-popup-content">
                <div class="nav-popup-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h4>Sign In Required</h4>
                <p>Please sign in to access this feature.</p>
                <button onclick="window.location.href='/signup-pro.html'" class="btn btn-primary btn-sm">
                    Sign In
                </button>
                <button onclick="this.closest('#nav-auth-popup').remove()" class="btn btn-outline btn-sm" style="margin-left: 0.5rem;">
                    Close
                </button>
            </div>
        `;

        // Add styles
        popup.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 1rem;
            z-index: 10001;
            max-width: 250px;
            animation: slideDown 0.3s ease-out;
            border: 1px solid #e2e8f0;
        `;

        // Add CSS for popup content
        const style = document.createElement('style');
        style.textContent = `
            .nav-popup-content {
                text-align: center;
            }
            
            .nav-popup-icon {
                font-size: 1.5rem;
                color: #4f46e5;
                margin-bottom: 0.5rem;
            }
            
            .nav-popup-content h4 {
                margin: 0 0 0.25rem 0;
                color: #1e293b;
                font-size: 1rem;
                font-weight: 600;
            }
            
            .nav-popup-content p {
                margin: 0 0 0.75rem 0;
                color: #64748b;
                font-size: 0.875rem;
            }
            
            .btn-sm {
                padding: 0.375rem 0.75rem;
                font-size: 0.875rem;
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 640px) {
                #nav-auth-popup {
                    top: 60px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        
        if (!document.querySelector('#nav-popup-styles')) {
            style.id = 'nav-popup-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(popup);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (document.getElementById('nav-auth-popup')) {
                popup.style.animation = 'slideDown 0.3s ease-out reverse';
                setTimeout(() => popup.remove(), 300);
            }
        }, 4000);
    }

    setupActiveNavigation() {
        // Set active navigation link based on current page
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop().replace('.html', '') || 'index-pro';
        
        // Update all navigation links
        const navLinks = document.querySelectorAll('.main-header-link, .mobile-menu-nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const linkPage = href.replace('.html', '');
                if (linkPage === currentPage || 
                    (currentPage === 'index-pro' && linkPage === 'index') ||
                    (currentPage === 'index' && linkPage === 'index-pro')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }

    setupUserMenu() {
        this.updateUserUI();
        
        // Setup user menu dropdown
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.addEventListener('click', () => {
                // Toggle dropdown menu
                const dropdown = document.createElement('div');
                dropdown.className = 'user-dropdown';
                dropdown.innerHTML = `
                    <a href="profile-pro.html" class="dropdown-item">
                        <i class="fas fa-user"></i> Profile
                    </a>
                    <a href="#" class="dropdown-item" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Sign Out
                    </a>
                `;
                dropdown.style.cssText = `
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: 8px;
                    box-shadow: var(--shadow);
                    min-width: 150px;
                    z-index: 1001;
                    display: none;
                `;
                
                const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
                dropdownItems.forEach(item => {
                    item.style.cssText = `
                        display: block;
                        padding: 0.75rem 1rem;
                        color: var(--gray-700);
                        text-decoration: none;
                        transition: var(--transition);
                        border-bottom: 1px solid var(--gray-100);
                    `;
                    item.addEventListener('mouseover', () => {
                        item.style.background = 'var(--gray-50)';
                    });
                    item.addEventListener('mouseout', () => {
                        item.style.background = 'transparent';
                    });
                });
                
                // Remove last item's border
                if (dropdownItems.length > 0) {
                    dropdownItems[dropdownItems.length - 1].style.borderBottom = 'none';
                }
                
                userMenu.appendChild(dropdown);
                
                // Toggle dropdown
                if (dropdown.style.display === 'none') {
                    dropdown.style.display = 'block';
                } else {
                    dropdown.remove();
                }
                
                // Close dropdown when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', function closeDropdown(e) {
                        if (!userMenu.contains(e.target) && !dropdown.contains(e.target)) {
                            dropdown.remove();
                            document.removeEventListener('click', closeDropdown);
                        }
                    });
                }, 100);
            });
        }
    }

    updateUserUI() {
        const user = localStorage.getItem('googleUser');
        const userMenu = document.getElementById('userMenu');
        const signInBtn = document.querySelector('.main-header-actions .btn-outline');
        
        if (user) {
            const userData = JSON.parse(user);
            
            // Show user menu, hide sign in button
            if (userMenu) {
                userMenu.style.display = 'block';
                const userName = userMenu.querySelector('.user-name');
                const userAvatar = userMenu.querySelector('.user-avatar img');
                
                if (userName) userName.textContent = userData.name;
                if (userAvatar && userData.picture) userAvatar.src = userData.picture;
            }
            
            // Hide sign in button
            if (signInBtn) {
                signInBtn.style.display = 'none';
            }
        } else {
            // Hide user menu, show sign in button
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            
            // Show sign in button
            if (signInBtn) {
                signInBtn.style.display = 'inline-flex';
            }
            if (userMenu) {
                userMenu.style.display = 'none';
            }
        }
    }

    setupThemeIntegration() {
        // Adjust theme selector position to avoid conflict with navigation
        const themeSelector = document.querySelector('.theme-selector');
        if (themeSelector) {
            const header = document.querySelector('.main-header');
            if (header) {
                const headerHeight = header.offsetHeight;
                themeSelector.style.top = (headerHeight + 20) + 'px';
            }
        }
    }

    // Public method to update user UI (called from other scripts)
    refreshUserUI() {
        this.updateUserUI();
    }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}

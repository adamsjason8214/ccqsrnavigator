// RBAC Integration Script
// This script integrates the role-based permission system with your existing application

// Enhanced user object structure
class UserWithPermissions {
    constructor(email, userData) {
        // Handle case where userData might be undefined
        if (!userData) {
            console.error('UserWithPermissions: userData is undefined for email:', email);
            userData = {
                name: email.split('@')[0], // Use email prefix as fallback name
                role: 'staff',
                password: '',
                brands: [],
                locations: []
            };
        }
        
        this.email = email;
        this.name = userData.name || email.split('@')[0];
        this.password = userData.password || '';
        
        // Map old role names to new RBAC roles or use existing RBAC role
        this.role = userData.role || this.mapToRBACRole(userData.role);
        
        // Use brands and locations from userData if available, otherwise initialize
        this.brands = userData.brands || this.initializeBrands(email);
        this.locations = userData.locations || this.initializeLocations(email);
        
        // For Super Admins, override brands and locations to ensure they have full access
        if (this.role === 'super_admin') {
            this.brands = 'all';
            this.locations = 'all';
        }
        
        // Create permission checker instance
        this.permissionChecker = new PermissionChecker(this.role, this.brands, this.locations);
    }
    
    mapToRBACRole(oldRole) {
        // If the role is already an RBAC role, return it
        if (Object.values(ROLES).includes(oldRole)) {
            return oldRole;
        }
        
        const roleMapping = {
            'admin': ROLES.ADMIN,
            'manager': ROLES.MANAGER,
            'staff': ROLES.STAFF
        };
        
        return roleMapping[oldRole] || ROLES.STAFF;
    }
    
    initializeBrands(email) {
        const domain = email.split('@')[1];
        const brandMapping = {
            'theopt.net': ['pizza'],
            'themipt.com': ['pizza'],
            'theflpt.com': ['pizza'],
            'couchmancompanies.com': ['pizza'],
            'gmail.com': ['pizza'],
            'smoothie.com': ['smoothie'],
            'doughnut.com': ['doughnut'],
            'taco.com': ['taco'],
            'xgolf.com': ['x-golf']
        };
        
        // Check email prefix for brand hints
        const emailLower = email.toLowerCase();
        if (emailLower.includes('smoothie')) return ['smoothie'];
        if (emailLower.includes('doughnut') || emailLower.includes('donut')) return ['doughnut'];
        if (emailLower.includes('taco')) return ['taco'];
        if (emailLower.includes('golf') || emailLower.includes('xgolf')) return ['x-golf'];
        if (emailLower.includes('office')) return ['office'];
        if (emailLower.includes('pizza')) return ['pizza'];
        
        const brands = brandMapping[domain] || ['pizza'];
        return brands === 'all' ? 'all' : brands;
    }
    
    initializeLocations(email) {
        // Extract location from email if possible
        const locationMatch = email.match(/^([a-zA-Z]+pizza)(\d+)?@/i);
        if (locationMatch) {
            const baseName = locationMatch[1];
            const number = locationMatch[2];
            return [`${baseName}${number ? ' ' + number : ''}`];
        }
        
        // Special cases
        const specialLocations = {
            'orionpizza@themipt.com': ['Orion Pizza'],
            'oxfordpizza@themipt.com': ['Oxford Pizza'],
            'bgpizza39@gmail.com': ['BG Pizza 39']
        };
        
        return specialLocations[email] || ['Main Location'];
    }
    
    hasPermission(permission) {
        return this.permissionChecker.hasPermission(permission);
    }
    
    hasToolAccess(tool) {
        return this.permissionChecker.hasToolAccess(tool);
    }
    
    canAccessBrand(brandId) {
        return this.permissionChecker.canAccessBrand(brandId);
    }
    
    canAccessLocation(locationId) {
        return this.permissionChecker.canAccessLocation(locationId);
    }
}

// Override the login function to use enhanced permissions
function enhancedLogin(email, password) {
    // Check if GLOBAL_USERS is defined
    if (typeof GLOBAL_USERS === 'undefined') {
        console.error('GLOBAL_USERS is not defined');
        return false;
    }
    
    const userData = GLOBAL_USERS[email.toLowerCase()];
    
    if (userData && userData.password === password) {
        // Create enhanced user object
        const user = new UserWithPermissions(email, userData);
        
        // Store in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            name: user.name,
            role: user.role,
            brands: user.brands,
            locations: user.locations
        }));
        
        // Update UI based on permissions
        setTimeout(() => {
            updateUIBasedOnPermissions(user);
            updateRoleBadge(user);
        }, 100);
        
        return true;
    }
    
    return false;
}

// Update role badge to show new role names
function updateRoleBadge(user) {
    const roleDisplayNames = {
        [ROLES.SUPER_ADMIN]: 'Super Administrator',
        [ROLES.ADMIN]: 'Administrator',
        [ROLES.GENERAL_MANAGER]: 'General Manager',
        [ROLES.MANAGER]: 'Manager',
        [ROLES.STAFF]: 'Staff'
    };
    
    const userBadge = document.querySelector('.user-badge');
    if (userBadge) {
        userBadge.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${user.name}</span>
            <span style="font-size: 0.85em; opacity: 0.8; margin-left: 8px;">
                (${roleDisplayNames[user.role]})
            </span>
        `;
    }
}

// Enhanced user management functions
function canCurrentUserCreateUser(targetRole) {
    const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUserData.email) return false;
    
    // Get user data from GLOBAL_USERS or custom users
    const customUsers = JSON.parse(localStorage.getItem('couchman_users') || '{}');
    const globalUsers = (typeof GLOBAL_USERS !== 'undefined') ? GLOBAL_USERS : {};
    const allUsers = { ...globalUsers, ...customUsers };
    const userData = allUsers[currentUserData.email] || currentUserData;
    
    const currentUser = new UserWithPermissions(
        currentUserData.email,
        userData
    );
    
    return currentUser.hasPermission(PERMISSIONS.CREATE_USERS) &&
           canUserModifyRole(currentUser.role, targetRole);
}

function canCurrentUserDeleteUser(targetUserRole) {
    const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUserData.email) return false;
    
    // Get user data from GLOBAL_USERS or custom users
    const customUsers = JSON.parse(localStorage.getItem('couchman_users') || '{}');
    const globalUsers = (typeof GLOBAL_USERS !== 'undefined') ? GLOBAL_USERS : {};
    const allUsers = { ...globalUsers, ...customUsers };
    const userData = allUsers[currentUserData.email] || currentUserData;
    
    const currentUser = new UserWithPermissions(
        currentUserData.email,
        userData
    );
    
    if (targetUserRole === ROLES.ADMIN || targetUserRole === ROLES.SUPER_ADMIN) {
        return currentUser.hasPermission(PERMISSIONS.DELETE_ADMINS);
    }
    
    return currentUser.hasPermission(PERMISSIONS.DELETE_STAFF);
}

// Update the role select options based on current user's permissions
function updateRoleSelectOptions() {
    const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUserData.email) return;
    
    // Get user data from GLOBAL_USERS or custom users
    const customUsers = JSON.parse(localStorage.getItem('couchman_users') || '{}');
    const globalUsers = (typeof GLOBAL_USERS !== 'undefined') ? GLOBAL_USERS : {};
    const allUsers = { ...globalUsers, ...customUsers };
    const userData = allUsers[currentUserData.email] || currentUserData;
    
    const currentUser = new UserWithPermissions(
        currentUserData.email,
        userData
    );
    
    const roleSelect = document.getElementById('newUserRole');
    if (!roleSelect) return;
    
    // Clear existing options
    roleSelect.innerHTML = '';
    
    // Add role options based on hierarchy
    const availableRoles = [];
    
    if (currentUser.role === ROLES.SUPER_ADMIN) {
        availableRoles.push(
            { value: ROLES.ADMIN, label: 'Administrator' },
            { value: ROLES.GENERAL_MANAGER, label: 'General Manager' },
            { value: ROLES.MANAGER, label: 'Manager' },
            { value: ROLES.STAFF, label: 'Staff' }
        );
    } else if (currentUser.role === ROLES.ADMIN) {
        availableRoles.push(
            { value: ROLES.GENERAL_MANAGER, label: 'General Manager' },
            { value: ROLES.MANAGER, label: 'Manager' },
            { value: ROLES.STAFF, label: 'Staff' }
        );
    } else if (currentUser.role === ROLES.GENERAL_MANAGER) {
        availableRoles.push(
            { value: ROLES.MANAGER, label: 'Manager' },
            { value: ROLES.STAFF, label: 'Staff' }
        );
    } else if (currentUser.role === ROLES.MANAGER) {
        availableRoles.push(
            { value: ROLES.STAFF, label: 'Staff' }
        );
    }
    
    availableRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.value;
        option.textContent = role.label;
        roleSelect.appendChild(option);
    });
}

// Tool visibility management
function setupToolVisibility() {
    const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUserData.email) return;
    
    // Get user data from GLOBAL_USERS or custom users
    const customUsers = JSON.parse(localStorage.getItem('couchman_users') || '{}');
    const globalUsers = (typeof GLOBAL_USERS !== 'undefined') ? GLOBAL_USERS : {};
    const allUsers = { ...globalUsers, ...customUsers };
    const userData = allUsers[currentUserData.email] || currentUserData;
    
    const currentUser = new UserWithPermissions(
        currentUserData.email,
        userData
    );
    
    // Get the user's security code
    const userSecurityCode = currentUser.permissionChecker ? 
        currentUser.permissionChecker.getSecurityCode() : 
        getSecurityCodeForRole(userData.role);
    
    // Tab visibility is now handled by initializeNavigationTabs() in main index.html
    // This function no longer manipulates tab display to avoid conflicts
    // The initializeNavigationTabs function properly handles mobile display
    
    // We only update the data attributes for reference
    document.querySelectorAll('.tabs > .tab[data-tab]').forEach(tab => {
        const tabName = tab.getAttribute('data-tab');
        
        // Set data attribute for security level (for CSS or other JS to use if needed)
        if (userSecurityCode >= 2) {
            tab.setAttribute('data-user-level', 'manager-plus');
        } else {
            const staffAllowedTabs = ['schedule', 'settings'];
            if (staffAllowedTabs.includes(tabName)) {
                tab.setAttribute('data-user-level', 'staff-allowed');
            } else {
                tab.setAttribute('data-user-level', 'staff-restricted');
            }
        }
    });
}

// Initialize RBAC on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUserData.email) {
        // Get user data from GLOBAL_USERS or custom users
        const customUsers = JSON.parse(localStorage.getItem('couchman_users') || '{}');
        const allUsers = { ...GLOBAL_USERS, ...customUsers };
        const userData = allUsers[currentUserData.email] || currentUserData;
        
        if (userData) {
            const user = new UserWithPermissions(
                currentUserData.email,
                userData
            );
            updateUIBasedOnPermissions(user);
            updateRoleBadge(user);
            setupToolVisibility();
        }
    }
    
    
    // Add event listener for add user modal
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            updateRoleSelectOptions();
        });
    }
});

// Export enhanced functions for use in main app
window.UserWithPermissions = UserWithPermissions;
window.enhancedLogin = enhancedLogin;
window.canCurrentUserCreateUser = canCurrentUserCreateUser;
window.canCurrentUserDeleteUser = canCurrentUserDeleteUser;
window.updateRoleSelectOptions = updateRoleSelectOptions;
window.setupToolVisibility = setupToolVisibility;
window.updateUIBasedOnPermissions = updateUIBasedOnPermissions;
window.updateRoleBadge = updateRoleBadge;

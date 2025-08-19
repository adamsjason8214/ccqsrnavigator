// Role-Based Access Control (RBAC) System
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    GENERAL_MANAGER: 'general_manager',
    MANAGER: 'manager',
    STAFF: 'staff'
};

// Security code mapping - higher codes have more privileges
const SECURITY_CODES = {
    SUPER_ADMIN: 5,
    ADMIN: 4, 
    GENERAL_MANAGER: 3,
    MANAGER: 2,
    STAFF: 1
};

// Tool permissions mapping
const TOOLS = {
    COMMISSARY_ORDERING: 'commissary_ordering',
    SCHEDULER: 'scheduler',
    PREP_SHEET: 'prep_sheet',
    DOUGH_PREP: 'dough_prep',
    STORE_CHECKLISTS: 'store_checklists',
    STAFF_MESSENGER: 'staff_messenger',
    BILL_UPLOAD: 'bill_upload',
    OFFICE_BRAND: 'office_brand'
};

// Permission definitions
const PERMISSIONS = {
    // User Management
    CREATE_USERS: 'create_users',
    DELETE_ADMINS: 'delete_admins',
    MANAGE_LOCATIONS: 'manage_locations',
    VIEW_ALL_BRANDS: 'view_all_brands',
    VIEW_ALL_LOCATIONS: 'view_all_locations',
    
    // Staff Management
    ADD_STAFF: 'add_staff',
    DELETE_STAFF: 'delete_staff',
    ASSIGN_ROLES: 'assign_roles',
    
    // Tool Access
    ACCESS_ALL_TOOLS: 'access_all_tools',
    VIEW_ONLY_TOOLS: 'view_only_tools',
    SCHEDULE_VIEW_ONLY: 'schedule_view_only',
    
    // Data Access
    VIEW_EVERYTHING: 'view_everything',
    VIEW_ASSIGNED_BRANDS: 'view_assigned_brands',
    VIEW_ASSIGNED_LOCATION: 'view_assigned_location'
};

// Role-Permission Mapping
const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
        permissions: [
            PERMISSIONS.VIEW_EVERYTHING,
            PERMISSIONS.CREATE_USERS,
            PERMISSIONS.DELETE_ADMINS,
            PERMISSIONS.MANAGE_LOCATIONS,
            PERMISSIONS.VIEW_ALL_BRANDS,
            PERMISSIONS.VIEW_ALL_LOCATIONS,
            PERMISSIONS.ACCESS_ALL_TOOLS,
            PERMISSIONS.ADD_STAFF,
            PERMISSIONS.DELETE_STAFF,
            PERMISSIONS.ASSIGN_ROLES
        ],
        tools: Object.values(TOOLS),
        brandAccess: 'all',
        locationAccess: 'all',
        securityCode: SECURITY_CODES.SUPER_ADMIN,
        description: 'Can view everything, create users, can delete admins, can create/add new locations'
    },
    
    [ROLES.ADMIN]: {
        permissions: [
            PERMISSIONS.VIEW_ASSIGNED_BRANDS,
            PERMISSIONS.CREATE_USERS,
            PERMISSIONS.DELETE_ADMINS,
            PERMISSIONS.MANAGE_LOCATIONS,
            PERMISSIONS.ACCESS_ALL_TOOLS,
            PERMISSIONS.ADD_STAFF,
            PERMISSIONS.DELETE_STAFF,
            PERMISSIONS.ASSIGN_ROLES
        ],
        tools: Object.values(TOOLS),
        brandAccess: 'assigned',
        locationAccess: 'assigned',
        securityCode: SECURITY_CODES.ADMIN,
        description: 'Can view assigned brands, create users in brands they are assigned, can delete admins, can create new locations'
    },
    
    [ROLES.GENERAL_MANAGER]: {
        permissions: [
            PERMISSIONS.VIEW_ASSIGNED_LOCATION,
            PERMISSIONS.ADD_STAFF,
            PERMISSIONS.DELETE_STAFF,
            PERMISSIONS.ASSIGN_ROLES,
            PERMISSIONS.ACCESS_ALL_TOOLS
        ],
        tools: [
            TOOLS.COMMISSARY_ORDERING,
            TOOLS.SCHEDULER,
            TOOLS.PREP_SHEET,
            TOOLS.DOUGH_PREP,
            TOOLS.STORE_CHECKLISTS,
            TOOLS.STAFF_MESSENGER,
            TOOLS.BILL_UPLOAD
        ],
        brandAccess: 'assigned_only',
        locationAccess: 'assigned_only',
        securityCode: SECURITY_CODES.GENERAL_MANAGER,
        description: 'All, Can Add, Delete, and Assign Managers and Staff Roles'
    },
    
    [ROLES.MANAGER]: {
        permissions: [
            PERMISSIONS.VIEW_ASSIGNED_LOCATION,
            PERMISSIONS.ADD_STAFF,
            PERMISSIONS.VIEW_ONLY_TOOLS
        ],
        tools: [
            TOOLS.COMMISSARY_ORDERING,
            TOOLS.SCHEDULER,
            TOOLS.PREP_SHEET,
            TOOLS.DOUGH_PREP,
            TOOLS.STORE_CHECKLISTS,
            TOOLS.STAFF_MESSENGER
        ],
        brandAccess: 'assigned_only',
        locationAccess: 'assigned_only',
        securityCode: SECURITY_CODES.MANAGER,
        description: 'Can add staff'
    },
    
    [ROLES.STAFF]: {
        permissions: [
            PERMISSIONS.VIEW_ASSIGNED_LOCATION,
            PERMISSIONS.SCHEDULE_VIEW_ONLY
        ],
        tools: [
            TOOLS.SCHEDULER,
            TOOLS.STAFF_MESSENGER
        ],
        brandAccess: 'assigned_only',
        locationAccess: 'assigned_only',
        securityCode: SECURITY_CODES.STAFF,
        description: 'View only, limited access to schedule features'
    }
};

// Permission checking functions
class PermissionChecker {
    constructor(userRole, userBrands = [], userLocations = []) {
        this.role = userRole;
        this.brands = userBrands;
        this.locations = userLocations;
        this.roleConfig = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[ROLES.STAFF];
    }
    
    hasPermission(permission) {
        return this.roleConfig.permissions.includes(permission);
    }
    
    hasToolAccess(tool) {
        return this.roleConfig.tools.includes(tool);
    }
    
    canAccessBrand(brandId) {
        if (this.roleConfig.brandAccess === 'all') return true;
        if (this.roleConfig.brandAccess === 'assigned') return this.brands.includes(brandId);
        if (this.roleConfig.brandAccess === 'assigned_only') return this.brands.includes(brandId);
        return false;
    }
    
    canAccessLocation(locationId) {
        if (this.roleConfig.locationAccess === 'all') return true;
        if (this.roleConfig.locationAccess === 'assigned') return this.locations.includes(locationId);
        if (this.roleConfig.locationAccess === 'assigned_only') return this.locations.includes(locationId);
        return false;
    }
    
    canCreateUser() {
        return this.hasPermission(PERMISSIONS.CREATE_USERS);
    }
    
    canDeleteAdmin() {
        return this.hasPermission(PERMISSIONS.DELETE_ADMINS);
    }
    
    canManageStaff() {
        return this.hasPermission(PERMISSIONS.ADD_STAFF) || 
               this.hasPermission(PERMISSIONS.DELETE_STAFF);
    }
    
    canAssignRoles() {
        return this.hasPermission(PERMISSIONS.ASSIGN_ROLES);
    }
    
    canViewAllData() {
        return this.hasPermission(PERMISSIONS.VIEW_EVERYTHING);
    }
    
    getAccessibleTools() {
        return this.roleConfig.tools;
    }
    
    getRoleDescription() {
        return this.roleConfig.description;
    }
    
    getSecurityCode() {
        return this.roleConfig.securityCode || SECURITY_CODES.STAFF;
    }
    
    canViewUserWithSecurityCode(targetSecurityCode) {
        const mySecurityCode = this.getSecurityCode();
        return mySecurityCode >= targetSecurityCode;
    }
    
    canCreateUserWithSecurityCode(targetSecurityCode) {
        const mySecurityCode = this.getSecurityCode();
        return mySecurityCode >= targetSecurityCode;
    }
}

// UI Permission Helper Functions
function updateUIBasedOnPermissions(user) {
    const checker = new PermissionChecker(user.role, user.brands || [], user.locations || []);
    
    // Hide/show user management tab
    const usersTab = document.getElementById('usersTab');
    if (usersTab) {
        if (!checker.canCreateUser() && !checker.canManageStaff()) {
            usersTab.style.display = 'none';
        } else {
            usersTab.style.display = ''; // Ensure it's visible for users with permissions
        }
    }
    
    // Don't modify section visibility - let the tab system handle that
    // Just update functionality within sections
    
    // Update schedule section for staff (view-only)
    if (user.role === ROLES.STAFF) {
        // Make schedule read-only
        const scheduleInputs = document.querySelectorAll('#scheduleSection input, #scheduleSection select');
        scheduleInputs.forEach(input => {
            input.disabled = true;
        });
        
        // Hide action buttons
        const actionButtons = document.querySelectorAll('#addEmployeeBtn, #emailScheduleBtn, #printScheduleBtn');
        actionButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // Update user management section
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        // Show Add User button for security level 3+ (General Manager and above)
        const userSecurityCode = checker.getSecurityCode();
        if (userSecurityCode < 3) {
            addUserBtn.style.display = 'none';
        } else {
            addUserBtn.style.display = ''; // Ensure it's visible for users with permissions
        }
    }
    
    // Filter visible data based on brand/location access
    filterDataByAccess(checker);
}

function filterDataByAccess(checker) {
    // This function would filter displayed data based on user's brand/location access
    // Implementation depends on your data structure
}

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY = {
    [ROLES.SUPER_ADMIN]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.GENERAL_MANAGER]: 3,
    [ROLES.MANAGER]: 2,
    [ROLES.STAFF]: 1
};

function canUserModifyRole(currentUserRole, targetUserRole) {
    return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetUserRole];
}

function getSecurityCodeForRole(role) {
    return ROLE_PERMISSIONS[role]?.securityCode || SECURITY_CODES.STAFF;
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ROLES,
        TOOLS,
        PERMISSIONS,
        ROLE_PERMISSIONS,
        SECURITY_CODES,
        PermissionChecker,
        updateUIBasedOnPermissions,
        canUserModifyRole,
        getSecurityCodeForRole,
        ROLE_HIERARCHY
    };
}

// Also make available globally for browser
if (typeof window !== 'undefined') {
    window.ROLES = ROLES;
    window.TOOLS = TOOLS;
    window.PERMISSIONS = PERMISSIONS;
    window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
    window.SECURITY_CODES = SECURITY_CODES;
    window.PermissionChecker = PermissionChecker;
    window.updateUIBasedOnPermissions = updateUIBasedOnPermissions;
    window.canUserModifyRole = canUserModifyRole;
    window.getSecurityCodeForRole = getSecurityCodeForRole;
    window.ROLE_HIERARCHY = ROLE_HIERARCHY;
}
# CCQSR Navigator - App Essentials

## Overview
CCQSR Navigator is a comprehensive restaurant management system for multi-brand, multi-location operations. It handles schedules, checklists, inventory, and Basecamp integration.

## Core Architecture

### Frontend
- **Main File**: `dist/index.html` (14,000+ lines - needs refactoring)
- **Technology**: Vanilla JavaScript, HTML, CSS
- **Hosting**: Netlify with auto-deploy from GitHub

### Backend
- **Serverless Functions**: Netlify Functions (Node.js)
- **Database**: PostgreSQL (Neon)
- **External Integration**: Basecamp API v3

## Essential Components

### 1. Authentication & User Management
- **Location**: `dist/index.html` lines 4970-5300
- **Features**:
  - User login with email/password
  - Role-based access control (RBAC)
  - Security codes (1-5 levels)
  - Brand/location restrictions

### 2. Schedule Management
- **Location**: `dist/index.html` lines 5755-7200
- **Database**: `schedules` table
- **Features**:
  - Weekly employee scheduling
  - Auto-save functionality
  - Budget calculations (25% of sales)
  - Overtime calculations
  - Brand-specific roles

### 3. Brand-Specific Configurations

#### Taco Locations (Taco 1-3)
- **Roles**: GM, Bartender Lead, Bartender, Cook Lead, Cook
- **Role Categories**:
  - GM: Salaried manager
  - Leads: Hourly managers
  - Bartender/Cook: Crew

#### Doughnut Locations (ODT1-ODT6)
- **Roles**: GM, Barista, FOH, Den, Kitchen
- **Shift tracking**: Position-specific counts

#### Office Administration
- **Special handling**: Cross-location schedule view
- **Unique features**: Multi-location employee management

### 4. Basecamp Integration
- **Files**: 
  - `dist/basecamp-integration.js` - Main integration
  - `netlify/functions/basecamp-upload.js` - Upload handler
- **Vault Mappings**:
  - Opening Checklists: `8971352076`
  - Closing Checklists: `8971352307`
  - Weekly Checklists: `8971352953`
  - Monthly Checklists: `8971352839`
  - Field Manager: `8971288702`
  - Schedules: `8971651842`

### 5. Database Operations
- **File**: `dist/database-operations.js`
- **Tables**:
  - `users` - User accounts and permissions
  - `employees` - Employee records by location
  - `schedules` - Weekly schedule data
  - `prep_lists` - Prep list items
  - `inventory` - Inventory counts
  - `checklists` - Checklist submissions
  - `par_lists` - Par levels

### 6. Netlify Functions (Backend APIs)
- **Location**: `netlify/functions/`
- **Endpoints**:
  - `employees.js` - Employee CRUD operations
  - `schedules.js` - Schedule save/load
  - `users.js` - User management
  - `basecamp-upload.js` - Basecamp document upload
  - `prep-lists.js` - Prep list management
  - `inventory.js` - Inventory tracking
  - `checklists.js` - Checklist tracking
  - `par-lists.js` - Par level management

## Known Issues & Technical Debt

### 1. Code Organization
- **Problem**: Single 14,000+ line HTML file
- **Solution**: Split into modules:
  - `schedule.js` - Schedule management
  - `auth.js` - Authentication
  - `checklists.js` - Checklist functionality
  - `inventory.js` - Inventory management
  - `api.js` - API calls
  - `utils.js` - Utility functions

### 2. Duplicate Functions
- `getScheduleRoleOptions()` appears twice (lines 6038 and 6100)
- Multiple role configuration sections
- Repeated Basecamp integration code

### 3. Hardcoded Values
- Location/brand mappings scattered throughout
- Role definitions in multiple places
- Security codes duplicated

### 4. Error Handling
- Network errors need better user feedback
- Silent failures in permission checks
- Type conversion issues (string vs number)

## Critical Business Logic

### 1. Security Code System
```javascript
// Security levels determine permissions
5 = Super Admin (all permissions)
4 = Admin (most permissions)
3 = Manager (can edit schedules, employees)
2 = Lead (limited edit permissions)
1 = Crew (view only)
0 = No access
```

### 2. Budget Calculation
```javascript
// Weekly payroll budget = 25% of projected sales
weeklyPayrollBudget = totalWeeklySales * 0.25
```

### 3. Overtime Calculation
```javascript
// Time and a half after 40 hours
regularHours = Math.min(weeklyHours, 40)
overtimeHours = Math.max(0, weeklyHours - 40)
weeklyPay = (regularHours * rate) + (overtimeHours * rate * 1.5)
```

## Environment Variables (Netlify)
- `NETLIFY_DATABASE_URL` - Neon PostgreSQL connection string
- Basecamp OAuth stored in functions (needs migration to env vars)

## Deployment Process
1. Code pushed to GitHub repo: `adamsjason8214/ccqsrnavigator`
2. Netlify auto-deploys from `main` branch
3. Functions deploy automatically
4. Database migrations manual (need automation)

## Recommended Refactoring Priority

### Phase 1: Immediate Fixes
1. Extract JavaScript from HTML into separate files
2. Consolidate duplicate functions
3. Create configuration file for brands/locations/roles
4. Add proper error handling and loading states

### Phase 2: Architecture Improvements
1. Implement module pattern or ES6 modules
2. Create service layer for API calls
3. Add state management system
4. Implement proper event delegation

### Phase 3: Enhanced Features
1. Add offline support with service workers
2. Implement real-time updates
3. Add data export functionality
4. Create mobile-responsive design

### Phase 4: Testing & Documentation
1. Add unit tests for business logic
2. Create integration tests for API endpoints
3. Document API endpoints
4. Create user documentation

## Dependencies
- **Frontend**: 
  - jsPDF (PDF generation)
  - No framework (consider React/Vue for refactor)
- **Backend**:
  - Node.js
  - PostgreSQL client
  - Basecamp API

## Security Considerations
1. Basecamp OAuth token in code (needs secure storage)
2. User credentials in localStorage (consider session storage)
3. SQL injection prevention in backend
4. Rate limiting needed on API endpoints
5. CORS configuration review

## Performance Optimizations Needed
1. Code splitting and lazy loading
2. Database query optimization
3. Caching strategy implementation
4. Image optimization for checklists
5. Reduce initial bundle size

## Contact & Support
- Repository: https://github.com/adamsjason8214/ccqsrnavigator
- Deployment: Netlify
- Database: Neon (PostgreSQL)
- External API: Basecamp v3
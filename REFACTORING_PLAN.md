# Code Refactoring Plan

## Current State Analysis

### File Structure Issues
```
dist/
├── index.html (14,000+ lines - MONOLITHIC)
├── basecamp-integration.js (800 lines)
├── database-operations.js (220 lines)
├── rolepermissions.js (80 lines)
├── styles.css (embedded in HTML)
└── [other support files]
```

### Major Problems
1. **Single File Chaos**: Everything in index.html
2. **Duplicate Code**: Functions defined multiple times
3. **No Module System**: Global namespace pollution
4. **Mixed Concerns**: UI, logic, and data mixed together
5. **Hardcoded Values**: Configuration scattered everywhere

## Proposed New Structure

```
dist/
├── index.html (minimal - just structure)
├── css/
│   └── styles.css
├── js/
│   ├── app.js (main entry point)
│   ├── config/
│   │   ├── brands.js
│   │   ├── locations.js
│   │   ├── roles.js
│   │   └── constants.js
│   ├── modules/
│   │   ├── auth.js
│   │   ├── schedule.js
│   │   ├── employees.js
│   │   ├── checklists.js
│   │   ├── inventory.js
│   │   └── reports.js
│   ├── services/
│   │   ├── api.js
│   │   ├── database.js
│   │   ├── basecamp.js
│   │   └── storage.js
│   └── utils/
│       ├── formatters.js
│       ├── validators.js
│       └── helpers.js
└── data/
    └── config.json
```

## Module Breakdown

### config/brands.js
```javascript
export const BRANDS = {
  TACO: {
    name: 'Taco',
    locations: ['Taco 1', 'Taco 2', 'Taco 3'],
    roles: [
      { value: 'GM', text: 'GM', category: 'manager', salaried: true },
      { value: 'Bartender Lead', text: 'Bartender Lead', category: 'lead' },
      { value: 'Bartender', text: 'Bartender', category: 'crew' },
      { value: 'Cook Lead', text: 'Cook Lead', category: 'lead' },
      { value: 'Cook', text: 'Cook', category: 'crew' }
    ]
  },
  DOUGHNUT: {
    name: 'Doughnut',
    locations: ['ODT1', 'ODT2', 'ODT3', 'ODT4', 'ODT5', 'ODT6'],
    roles: [
      { value: 'GM', text: 'GM', category: 'manager', salaried: true },
      { value: 'Barista', text: 'Barista', category: 'crew' },
      { value: 'FOH', text: 'Front of House', category: 'crew' },
      { value: 'Den', text: 'Den', category: 'crew' },
      { value: 'Kitchen', text: 'Kitchen', category: 'crew' }
    ]
  }
  // ... other brands
};
```

### modules/schedule.js
```javascript
import { api } from '../services/api.js';
import { BRANDS } from '../config/brands.js';

export class ScheduleManager {
  constructor() {
    this.scheduleData = {};
    this.currentWeek = null;
    this.employees = [];
  }

  async loadSchedule(location, weekStart) {
    // Load schedule logic
  }

  async saveSchedule() {
    // Save schedule logic
  }

  calculatePayroll() {
    // Payroll calculation logic
  }

  validateSchedule() {
    // Validation logic
  }
}
```

### services/api.js
```javascript
export class APIService {
  constructor(baseUrl = '/.netlify/functions') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    // Centralized API request handling
    // Error handling, retry logic, etc.
  }

  // Specific API methods
  async getEmployees(location) {
    return this.request('/employees', { 
      params: { location } 
    });
  }

  async saveSchedule(data) {
    return this.request('/schedules', {
      method: 'POST',
      body: data
    });
  }
}
```

## Step-by-Step Refactoring Process

### Phase 1: Extract Configuration (Week 1)
1. Create `config/` directory
2. Extract all hardcoded values
3. Create configuration files for:
   - Brands and locations
   - Roles and permissions
   - API endpoints
   - UI constants

### Phase 2: Create Service Layer (Week 2)
1. Create `services/` directory
2. Extract API calls into `api.js`
3. Create `database.js` for DB operations
4. Create `basecamp.js` for Basecamp integration
5. Implement error handling and retry logic

### Phase 3: Modularize Features (Weeks 3-4)
1. Create `modules/` directory
2. Extract each major feature:
   - Authentication (`auth.js`)
   - Schedule management (`schedule.js`)
   - Employee management (`employees.js`)
   - Checklists (`checklists.js`)
   - Inventory (`inventory.js`)

### Phase 4: Extract Utilities (Week 5)
1. Create `utils/` directory
2. Extract helper functions
3. Create formatters for dates, currency, etc.
4. Create validators for form inputs
5. Remove duplicate functions

### Phase 5: Implement Module System (Week 6)
1. Add ES6 module imports/exports
2. Create main `app.js` entry point
3. Implement initialization flow
4. Set up build process (webpack/rollup)

### Phase 6: Clean Up HTML (Week 7)
1. Remove all JavaScript from HTML
2. Extract CSS to separate file
3. Use semantic HTML5 elements
4. Add proper ARIA labels
5. Implement responsive design

### Phase 7: Testing (Week 8)
1. Add Jest for unit testing
2. Create tests for business logic
3. Add integration tests for API
4. Implement E2E testing

## Quick Wins (Can Do Now)

### 1. Remove Duplicate Functions
- `getScheduleRoleOptions()` - Keep only one version
- Consolidate role definitions
- Remove commented code

### 2. Extract Constants
```javascript
// constants.js
export const SECURITY_LEVELS = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  LEAD: 2,
  CREW: 1,
  NONE: 0
};

export const PAYROLL_PERCENTAGE = 0.25;
export const OVERTIME_THRESHOLD = 40;
export const OVERTIME_MULTIPLIER = 1.5;
```

### 3. Create Configuration File
```javascript
// config.js
export const APP_CONFIG = {
  api: {
    baseUrl: '/.netlify/functions',
    timeout: 30000,
    retries: 3
  },
  basecamp: {
    accountId: '6023243',
    projectId: '43545521',
    vaults: {
      opening: '8971352076',
      closing: '8971352307',
      weekly: '8971352953',
      monthly: '8971352839',
      fieldManager: '8971288702',
      schedule: '8971651842'
    }
  }
};
```

## Benefits of Refactoring

1. **Maintainability**: Easier to find and fix bugs
2. **Scalability**: Easier to add new features
3. **Performance**: Smaller initial load, lazy loading
4. **Testing**: Isolated modules are testable
5. **Team Collaboration**: Clear separation of concerns
6. **Documentation**: Self-documenting code structure

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Comprehensive testing before each phase |
| User disruption | Deploy to staging first |
| Data loss | Backup all data before changes |
| Integration issues | Keep old code as fallback |

## Success Metrics

- [ ] Reduce initial load time by 50%
- [ ] Achieve 80% code coverage with tests
- [ ] Reduce bug reports by 40%
- [ ] Improve developer onboarding from days to hours
- [ ] Enable feature deployment in hours vs days

## Timeline

- **Month 1**: Configuration extraction and service layer
- **Month 2**: Feature modularization
- **Month 3**: Testing and optimization
- **Total Duration**: 3 months for complete refactor

## Next Steps

1. Get stakeholder approval
2. Set up staging environment
3. Create feature flags for gradual rollout
4. Begin with Phase 1 (configuration extraction)
5. Document changes as we go
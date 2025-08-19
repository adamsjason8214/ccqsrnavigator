// Database operations helper module
const DB_API = {
    // Base URL for API calls (will be replaced with actual Netlify URL in production)
    baseUrl: '/.netlify/functions',

    // Helper function for API calls
    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add user credentials for user management, employee endpoints, and par lists (for permissions)
        if (endpoint.includes('/users') || endpoint.includes('/employees') || endpoint.includes('/par-lists')) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            console.log('DB_API: Current user from localStorage:', currentUser);
            
            if (currentUser.email && currentUser.role !== undefined) {
                options.headers['x-current-user-email'] = currentUser.email;
                // Send the role as-is (either string like "super_admin" or number)
                options.headers['x-current-user-role'] = String(currentUser.role);
                console.log('DB_API: Added headers:', {
                    'x-current-user-email': options.headers['x-current-user-email'],
                    'x-current-user-role': options.headers['x-current-user-role']
                });
            } else {
                console.warn('DB_API: Missing user credentials:', currentUser);
            }
        }

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            console.log('DB_API: Making request to:', `${this.baseUrl}${endpoint}`);
            console.log('DB_API: Request options:', options);
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            if (!response.ok) {
                let errorDetails = response.statusText;
                try {
                    const errorBody = await response.text();
                    console.error('API Error Response:', errorBody);
                    errorDetails = errorBody || response.statusText;
                } catch (e) {
                    console.error('Could not parse error response');
                }
                throw new Error(`API call failed: ${response.status} - ${errorDetails}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    // Schedule operations
    schedules: {
        async get(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return DB_API.apiCall(`/schedules${queryString ? '?' + queryString : ''}`);
        },

        async save(scheduleData) {
            return DB_API.apiCall('/schedules', 'POST', scheduleData);
        },

        async update(id, scheduleData) {
            return DB_API.apiCall('/schedules', 'PUT', { id, ...scheduleData });
        },

        async delete(id) {
            return DB_API.apiCall(`/schedules?id=${id}`, 'DELETE');
        }
    },

    // Prep list operations
    prepLists: {
        async get(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return DB_API.apiCall(`/prep-lists${queryString ? '?' + queryString : ''}`);
        },

        async save(prepData) {
            return DB_API.apiCall('/prep-lists', 'POST', prepData);
        },

        async update(id, prepData) {
            return DB_API.apiCall('/prep-lists', 'PUT', { id, ...prepData });
        },

        async delete(id) {
            return DB_API.apiCall(`/prep-lists?id=${id}`, 'DELETE');
        }
    },

    // Inventory operations
    inventory: {
        async get(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return DB_API.apiCall(`/inventory${queryString ? '?' + queryString : ''}`);
        },

        async save(inventoryData) {
            return DB_API.apiCall('/inventory', 'POST', inventoryData);
        },

        async update(id, inventoryData) {
            return DB_API.apiCall('/inventory', 'PUT', { id, ...inventoryData });
        },

        async delete(id) {
            return DB_API.apiCall(`/inventory?id=${id}`, 'DELETE');
        },

        async getLatest(location, userId) {
            return this.get({ location, user_id: userId, latest: 'true' });
        }
    },

    // Checklist operations
    checklists: {
        async trackSubmission(checklistData) {
            return DB_API.apiCall('/checklists', 'POST', checklistData);
        },

        async updateStatus(id, status) {
            return DB_API.apiCall('/checklists', 'PUT', {
                id,
                submission_status: status,
                submitted_at: new Date().toISOString()
            });
        },

        async getSubmissions(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return DB_API.apiCall(`/checklists${queryString ? '?' + queryString : ''}`);
        },

        async cleanupOld(daysOld = 30) {
            return DB_API.apiCall(`/checklists?older_than_days=${daysOld}`, 'DELETE');
        },

        // Helper function to clear local checklist data after Basecamp submission
        clearLocalChecklist(checklistType) {
            // This would clear the specific checklist from localStorage
            // The actual implementation depends on how checklists are stored locally
            const checklists = JSON.parse(localStorage.getItem('checklists') || '{}');
            delete checklists[checklistType];
            localStorage.setItem('checklists', JSON.stringify(checklists));
        }
    },

    // User operations (existing)
    users: {
        async get(email = null) {
            const params = email ? `?email=${encodeURIComponent(email)}` : '';
            return DB_API.apiCall(`/users${params}`);
        },

        async create(userData) {
            return DB_API.apiCall('/users', 'POST', userData);
        },

        async update(userData) {
            return DB_API.apiCall('/users', 'PUT', userData);
        },

        async delete(id) {
            return DB_API.apiCall(`/users?id=${id}`, 'DELETE');
        }
    },

    // Employee operations
    employees: {
        async get(locationId = null) {
            const params = locationId ? `?location_id=${encodeURIComponent(locationId)}` : '';
            return DB_API.apiCall(`/employees${params}`);
        },

        async create(employeeData) {
            return DB_API.apiCall('/employees', 'POST', employeeData);
        },

        async update(id, employeeData) {
            return DB_API.apiCall('/employees', 'PUT', { id, ...employeeData });
        },

        async delete(id) {
            return DB_API.apiCall(`/employees?id=${id}`, 'DELETE');
        }
    },

    // Par list operations
    parLists: {
        async get(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return DB_API.apiCall(`/par-lists${queryString ? '?' + queryString : ''}`);
        },

        async save(parData) {
            return DB_API.apiCall('/par-lists', 'POST', parData);
        },

        async update(id, parData) {
            return DB_API.apiCall('/par-lists', 'PUT', { id, ...parData });
        },

        async delete(id) {
            return DB_API.apiCall(`/par-lists?id=${id}`, 'DELETE');
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DB_API;
} else {
    window.DB_API = DB_API;
}
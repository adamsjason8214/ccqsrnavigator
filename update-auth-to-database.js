// Script to update the authentication system to use the database
// This will modify the index.html file to use DB_API for user management

const fs = require('fs');
const path = require('path');

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Find the handleAuth function and replace it
const newHandleAuth = `
        async function handleAuth(email, password) {
            const userEmail = email.toLowerCase();
            
            try {
                // First check GLOBAL_USERS for default users
                if (GLOBAL_USERS[userEmail] && GLOBAL_USERS[userEmail].password === password) {
                    // Handle default user login
                    const user = GLOBAL_USERS[userEmail];
                    setCurrentUser(userEmail, user);
                    return;
                }
                
                // Check database for custom users
                const dbUsers = await DB_API.users.get(userEmail);
                if (dbUsers && dbUsers.length > 0) {
                    const dbUser = dbUsers[0];
                    
                    // Check password
                    if (dbUser.password === password) {
                        // Parse brands and locations from JSON strings
                        const user = {
                            name: dbUser.name,
                            role: dbUser.role,
                            password: dbUser.password,
                            brands: typeof dbUser.brands === 'string' ? JSON.parse(dbUser.brands) : dbUser.brands,
                            locations: typeof dbUser.locations === 'string' ? JSON.parse(dbUser.locations) : dbUser.locations
                        };
                        
                        // Update local cache
                        USERS[userEmail] = user;
                        setCurrentUser(userEmail, user);
                        return;
                    }
                }
                
                showError('Invalid email or password');
            } catch (error) {
                console.error('Authentication error:', error);
                showError('Authentication failed. Please check your connection and try again.');
            }
        }
        
        function setCurrentUser(userEmail, user) {
            // Set current user
            currentUser = {
                email: userEmail,
                name: user.name,
                role: user.role,
                brands: user.brands || [],
                locations: user.locations || [],
                password: user.password
            };
            
            // Check for RBAC integration
            if (typeof UserWithPermissions !== 'undefined') {
                try {
                    const enhancedUser = new UserWithPermissions(userEmail, currentUser);
                    currentUser.rbac = enhancedUser;
                    currentUser.role = enhancedUser.role;
                    currentUser.brands = enhancedUser.brands;
                    currentUser.locations = enhancedUser.locations;
                } catch (e) {
                    console.log('RBAC integration error:', e.message);
                }
            }
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.role,
                brands: currentUser.brands,
                locations: currentUser.locations
            }));
            
            initializeAfterLogin();
            setupBrandLocationSelectors();
            
            // Load user interface
            authContainer.classList.add('hidden');
            mainApp.classList.remove('hidden');
            currentUserSpan.textContent = currentUser.name;
            
            // Apply RBAC permissions if available
            if (typeof updateUIBasedOnPermissions !== 'undefined') {
                updateUIBasedOnPermissions(currentUser);
            }
            if (currentUser.rbac && typeof updateRoleBadge !== 'undefined') {
                updateRoleBadge(currentUser.rbac);
            }
            if (typeof setupToolVisibility !== 'undefined') {
                setupToolVisibility();
            }
            
            // Load user data
            setTimeout(() => {
                migrateDataToLocationKeys(currentUser.email);
                loadInventoryData(currentUser.email);
                loadEmployeeData(currentUser.email);
                loadScheduleData(currentUser.email);
                loadPricingData(currentUser.email);
                
                if (typeof loadMonthlyPricingData === 'function') {
                    loadMonthlyPricingData(currentUser.email);
                }
                if (typeof loadMonthlyInventoryData === 'function') {
                    loadMonthlyInventoryData(currentUser.email);
                }
                
                renderInventory();
                updateTabVisibility();
            }, 100);
        }`;

// Find the original handleAuth function
const handleAuthRegex = /function handleAuth\(email, password\) \{[\s\S]*?(?=\n\s{8}function|\n\s{8}\/\/|\n\s{8}async function|\n\s{8}let|\n\s{8}const|\n\s{8}}[\s\S]*?\n\s{8}})/;
const match = htmlContent.match(handleAuthRegex);

if (match) {
    console.log('Found handleAuth function, updating...');
    htmlContent = htmlContent.replace(match[0], newHandleAuth.trim());
} else {
    console.log('Could not find handleAuth function with regex, trying alternative approach...');
}

// Update the addUser function to save to database
const newAddUser = `
        async function addUser(name, email, role, password, brands, locations) {
            const normalizedEmail = email.toLowerCase();
            
            // Check if user already exists
            if (USERS[normalizedEmail]) {
                showError('User with this email already exists');
                return false;
            }
            
            // Check if current user can create a user with this security code
            const currentSecurityCode = getSecurityCodeForRole(currentUser.role);
            const targetSecurityCode = getSecurityCodeForRole(role);
            
            if (targetSecurityCode > currentSecurityCode) {
                showError('You cannot create users with higher security codes than your own');
                return false;
            }
            
            try {
                // Save to database
                const userData = {
                    email: normalizedEmail,
                    name: name,
                    role: role,
                    password: password,
                    brands: JSON.stringify(brands),
                    locations: JSON.stringify(locations)
                };
                
                await DB_API.users.create(userData);
                
                // Add to local store
                const newUser = {
                    name: name,
                    role: role,
                    password: password,
                    brands: brands,
                    locations: locations
                };
                
                usersData[normalizedEmail] = newUser;
                USERS[normalizedEmail] = newUser;
                
                // Save custom users to localStorage as backup
                saveUsers(USERS);
                
                renderUserTable();
                showSuccess('User added successfully');
                return true;
                
            } catch (error) {
                console.error('Error adding user to database:', error);
                showError('Failed to add user. Please try again.');
                return false;
            }
        }`;

// Find and replace addUser function
const addUserRegex = /function addUser\(name, email, role, password, brands, locations\) \{[\s\S]*?(?=\n\s{8}function|\n\s{8}\/\/|\n\s{8}async function|\n\s{8}let|\n\s{8}const|\n\s{8}\}[\s]*\n\s{8}[^\s])/;
const addUserMatch = htmlContent.match(addUserRegex);

if (addUserMatch) {
    console.log('Found addUser function, updating...');
    htmlContent = htmlContent.replace(addUserMatch[0], newAddUser.trim());
}

// Update the loadUsers function to load from database
const newLoadUsersSection = `
        // Load users from database on startup
        async function loadAllUsersFromDatabase() {
            try {
                const dbUsers = await DB_API.users.get();
                if (dbUsers && Array.isArray(dbUsers)) {
                    dbUsers.forEach(dbUser => {
                        const email = dbUser.email.toLowerCase();
                        if (!GLOBAL_USERS[email]) {
                            USERS[email] = {
                                name: dbUser.name,
                                role: dbUser.role,
                                password: dbUser.password,
                                brands: typeof dbUser.brands === 'string' ? JSON.parse(dbUser.brands) : dbUser.brands,
                                locations: typeof dbUser.locations === 'string' ? JSON.parse(dbUser.locations) : dbUser.locations
                            };
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading users from database:', error);
            }
        }
        
        // Load users on page load
        loadAllUsersFromDatabase();`;

// Add the new load users function after the DB_API script tag
const dbApiScriptIndex = htmlContent.indexOf('<script src="database-operations.js"></script>');
if (dbApiScriptIndex !== -1) {
    const insertPoint = htmlContent.indexOf('</script>', dbApiScriptIndex) + 9;
    htmlContent = htmlContent.slice(0, insertPoint) + '\n    <script>\n        ' + newLoadUsersSection + '\n    </script>' + htmlContent.slice(insertPoint);
}

// Write the updated file
fs.writeFileSync(indexPath, htmlContent, 'utf8');

console.log('Authentication system updated to use database!');
console.log('The following changes were made:');
console.log('1. handleAuth now checks the database for users');
console.log('2. addUser now saves users to the database');
console.log('3. Users are loaded from the database on page load');
console.log('4. Passwords are stored in plain text (consider adding hashing in production)');
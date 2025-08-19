// Script to update the updateUser and deleteUser functions to use database

const fs = require('fs');
const path = require('path');

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// New updateUser function
const newUpdateUser = `
        async function updateUser(email, name, role, password, brands, locations) {
            const user = usersData[email];
            if (!user) return false;
            
            try {
                // Prepare update data
                const updateData = {
                    id: user.id || email, // Use ID if available, otherwise email
                    email: email,
                    name: name,
                    role: role,
                    brands: JSON.stringify(brands),
                    locations: JSON.stringify(locations)
                };
                
                // Only include password if it's being changed
                if (password) {
                    updateData.password = password;
                }
                
                // Update in database
                await DB_API.users.update(updateData);
                
                // Update local data
                user.name = name;
                user.role = role;
                user.brands = brands;
                user.locations = locations;
                
                // Update password if provided
                if (password) {
                    user.password = password;
                }
                
                // Update both display data and login data
                USERS[email] = user;
                
                // Save to localStorage as backup
                saveUsers(USERS);
                
                showSuccess(\`User \${name} updated successfully!\`);
                renderUsersTable();
                return true;
                
            } catch (error) {
                console.error('Error updating user:', error);
                showError('Failed to update user. Please try again.');
                return false;
            }
        }`;

// New deleteUser function
const newDeleteUser = `
        async function deleteUser(email) {
            const normalizedEmail = email.toLowerCase();
            const targetUser = USERS[normalizedEmail];
            
            if (!targetUser) {
                showError('User not found');
                return;
            }
            
            // Check role hierarchy
            if (!canManageUser(currentUser.role, targetUser.role)) {
                showError('You do not have permission to delete this user');
                return;
            }
            
            // Don't allow deleting default users
            if (GLOBAL_USERS[normalizedEmail]) {
                showError('Cannot delete default system users');
                return;
            }
            
            const userName = targetUser.name || email;
            
            if (confirm(\`Delete user \${userName}?\`)) {
                try {
                    // First get the user from database to get their ID
                    const dbUsers = await DB_API.users.get(normalizedEmail);
                    if (dbUsers && dbUsers.length > 0) {
                        // Delete from database
                        await DB_API.users.delete(dbUsers[0].id);
                    }
                    
                    // Remove from all stores
                    delete usersData[normalizedEmail];
                    delete USERS[normalizedEmail];
                    
                    // Update localStorage
                    const customUsers = JSON.parse(localStorage.getItem('couchman_users') || '{}');
                    delete customUsers[normalizedEmail];
                    localStorage.setItem('couchman_users', JSON.stringify(customUsers));
                    
                    renderUsersTable();
                    showSuccess(\`User \${userName} deleted successfully\`);
                    
                } catch (error) {
                    console.error('Error deleting user:', error);
                    showError('Failed to delete user. Please try again.');
                }
            }
        }`;

// Replace updateUser function
const updateUserRegex = /function updateUser\(email, name, role, password, brands, locations\) \{[\s\S]*?return true;\s*\}/;
const updateUserMatch = htmlContent.match(updateUserRegex);

if (updateUserMatch) {
    console.log('Found updateUser function, updating...');
    htmlContent = htmlContent.replace(updateUserMatch[0], newUpdateUser.trim());
} else {
    console.log('Could not find updateUser function');
}

// Replace deleteUser function
const deleteUserRegex = /function deleteUser\(email\) \{[\s\S]*?showSuccess\(`User \$\{userName\} deleted successfully`\);\s*\}\s*\}/;
const deleteUserMatch = htmlContent.match(deleteUserRegex);

if (deleteUserMatch) {
    console.log('Found deleteUser function, updating...');
    htmlContent = htmlContent.replace(deleteUserMatch[0], newDeleteUser.trim());
} else {
    console.log('Could not find deleteUser function');
}

// Write the updated file
fs.writeFileSync(indexPath, htmlContent, 'utf8');

console.log('User management functions updated to use database!');
console.log('Now users can:');
console.log('1. Log in from any device');
console.log('2. Create users that are accessible from all devices');
console.log('3. Update and delete users with database persistence');
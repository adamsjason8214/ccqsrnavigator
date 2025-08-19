const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function restoreDatabase(backupFile = 'latest-backup.json') {
    console.log('Starting database restore...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Read backup file
        const backupPath = path.join(__dirname, 'backups', backupFile);
        const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
        console.log(`Restoring from backup created at ${backupData.timestamp}`);
        
        await client.connect();
        console.log('Connected to database');
        
        // Restore users (merge with existing)
        if (backupData.users && backupData.users.length > 0) {
            console.log(`Restoring ${backupData.users.length} users...`);
            for (const user of backupData.users) {
                try {
                    await client.query(
                        `INSERT INTO users (email, name, role, password, brands, locations) 
                         VALUES ($1, $2, $3, $4, $5, $6) 
                         ON CONFLICT (email) DO UPDATE 
                         SET name = EXCLUDED.name,
                             role = EXCLUDED.role,
                             password = EXCLUDED.password,
                             brands = EXCLUDED.brands,
                             locations = EXCLUDED.locations`,
                        [user.email, user.name, user.role, user.password, user.brands, user.locations]
                    );
                } catch (e) {
                    console.error(`Error restoring user ${user.email}:`, e.message);
                }
            }
            console.log('Users restored');
        }
        
        // Restore schedules
        if (backupData.schedules && backupData.schedules.length > 0) {
            console.log(`Restoring ${backupData.schedules.length} schedules...`);
            for (const schedule of backupData.schedules) {
                try {
                    await client.query(
                        `INSERT INTO schedules (user_email, location, week_start, schedule_data) 
                         VALUES ($1, $2, $3, $4) 
                         ON CONFLICT (user_email, location, week_start) DO UPDATE 
                         SET schedule_data = EXCLUDED.schedule_data`,
                        [schedule.user_email, schedule.location, schedule.week_start, schedule.schedule_data]
                    );
                } catch (e) {
                    console.error(`Error restoring schedule:`, e.message);
                }
            }
            console.log('Schedules restored');
        }
        
        // Restore inventory
        if (backupData.inventory && backupData.inventory.length > 0) {
            console.log(`Restoring ${backupData.inventory.length} inventory items...`);
            for (const item of backupData.inventory) {
                try {
                    await client.query(
                        `INSERT INTO inventory (user_email, location, item_name, quantity, unit, category) 
                         VALUES ($1, $2, $3, $4, $5, $6) 
                         ON CONFLICT (user_email, location, item_name) DO UPDATE 
                         SET quantity = EXCLUDED.quantity,
                             unit = EXCLUDED.unit,
                             category = EXCLUDED.category`,
                        [item.user_email, item.location, item.item_name, item.quantity, item.unit, item.category]
                    );
                } catch (e) {
                    console.error(`Error restoring inventory item:`, e.message);
                }
            }
            console.log('Inventory restored');
        }
        
        // Restore prep lists
        if (backupData.prepLists && backupData.prepLists.length > 0) {
            console.log(`Restoring ${backupData.prepLists.length} prep lists...`);
            for (const prep of backupData.prepLists) {
                try {
                    await client.query(
                        `INSERT INTO prep_lists (user_email, location, list_name, list_data) 
                         VALUES ($1, $2, $3, $4) 
                         ON CONFLICT (user_email, location, list_name) DO UPDATE 
                         SET list_data = EXCLUDED.list_data`,
                        [prep.user_email, prep.location, prep.list_name, prep.list_data]
                    );
                } catch (e) {
                    console.error(`Error restoring prep list:`, e.message);
                }
            }
            console.log('Prep lists restored');
        }
        
        // Restore checklists
        if (backupData.checklists && backupData.checklists.length > 0) {
            console.log(`Restoring ${backupData.checklists.length} checklists...`);
            for (const checklist of backupData.checklists) {
                try {
                    await client.query(
                        `INSERT INTO checklists (user_email, location, checklist_type, checklist_data, completed_at) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [checklist.user_email, checklist.location, checklist.checklist_type, 
                         checklist.checklist_data, checklist.completed_at]
                    );
                } catch (e) {
                    console.error(`Error restoring checklist:`, e.message);
                }
            }
            console.log('Checklists restored');
        }
        
        console.log('Database restore completed');
        
    } catch (error) {
        console.error('Restore error:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

// Run restore if called directly
if (require.main === module) {
    const backupFile = process.argv[2] || 'latest-backup.json';
    restoreDatabase(backupFile);
}

module.exports = { restoreDatabase };
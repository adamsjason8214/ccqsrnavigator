const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function backupDatabase() {
    console.log('Starting database backup...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');
        
        const backup = {
            timestamp: new Date().toISOString(),
            users: [],
            schedules: [],
            inventory: [],
            prepLists: [],
            checklists: []
        };
        
        // Backup users
        try {
            const usersResult = await client.query('SELECT * FROM users');
            backup.users = usersResult.rows;
            console.log(`Backed up ${backup.users.length} users`);
        } catch (e) {
            console.log('Users table not found or error:', e.message);
        }
        
        // Backup schedules
        try {
            const schedulesResult = await client.query('SELECT * FROM schedules');
            backup.schedules = schedulesResult.rows;
            console.log(`Backed up ${backup.schedules.length} schedules`);
        } catch (e) {
            console.log('Schedules table not found or error:', e.message);
        }
        
        // Backup inventory
        try {
            const inventoryResult = await client.query('SELECT * FROM inventory');
            backup.inventory = inventoryResult.rows;
            console.log(`Backed up ${backup.inventory.length} inventory items`);
        } catch (e) {
            console.log('Inventory table not found or error:', e.message);
        }
        
        // Backup prep lists
        try {
            const prepResult = await client.query('SELECT * FROM prep_lists');
            backup.prepLists = prepResult.rows;
            console.log(`Backed up ${backup.prepLists.length} prep lists`);
        } catch (e) {
            console.log('Prep lists table not found or error:', e.message);
        }
        
        // Backup checklists
        try {
            const checklistsResult = await client.query('SELECT * FROM checklists');
            backup.checklists = checklistsResult.rows;
            console.log(`Backed up ${backup.checklists.length} checklists`);
        } catch (e) {
            console.log('Checklists table not found or error:', e.message);
        }
        
        // Write backup to file
        const backupDir = path.join(__dirname, 'backups');
        await fs.mkdir(backupDir, { recursive: true });
        
        const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(backupDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
        console.log(`Backup saved to ${filepath}`);
        
        // Also save latest backup
        const latestPath = path.join(backupDir, 'latest-backup.json');
        await fs.writeFile(latestPath, JSON.stringify(backup, null, 2));
        console.log(`Latest backup saved to ${latestPath}`);
        
    } catch (error) {
        console.error('Backup error:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

// Run backup if called directly
if (require.main === module) {
    backupDatabase();
}

module.exports = { backupDatabase };
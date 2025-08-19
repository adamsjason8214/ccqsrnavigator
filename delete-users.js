const { Client } = require('pg');

async function deleteUsers() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');
        
        const usersToDelete = [
            'scotthickson@theopt.net',
            'jasonadams@theopt.net'
        ];
        
        for (const email of usersToDelete) {
            try {
                const result = await client.query(
                    'DELETE FROM users WHERE email = $1 RETURNING email, name',
                    [email]
                );
                
                if (result.rows.length > 0) {
                    console.log(`✓ Deleted user: ${result.rows[0].name} (${result.rows[0].email})`);
                } else {
                    console.log(`- User not found: ${email}`);
                }
            } catch (error) {
                console.error(`Error deleting user ${email}:`, error.message);
            }
        }
        
        // Show remaining users
        console.log('\nRemaining users in database:');
        const remainingUsers = await client.query('SELECT email, name, role FROM users ORDER BY email');
        remainingUsers.rows.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
        });
        
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await client.end();
        console.log('\nDatabase connection closed');
    }
}

// Run the deletion
deleteUsers();
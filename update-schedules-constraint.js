const { Client } = require('pg');
require('dotenv').config();

async function updateSchedulesConstraint() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // First, drop the existing constraint
    console.log('Dropping existing constraint...');
    try {
      await client.query(`
        ALTER TABLE schedules 
        DROP CONSTRAINT IF EXISTS schedules_user_id_location_week_start_date_key;
      `);
      console.log('Existing constraint dropped');
    } catch (error) {
      console.log('No existing constraint to drop or error dropping:', error.message);
    }

    // Add new unique constraint for location + week_start_date only
    console.log('Adding new location-based constraint...');
    await client.query(`
      ALTER TABLE schedules 
      ADD CONSTRAINT schedules_location_week_start_date_key 
      UNIQUE (location, week_start_date);
    `);
    console.log('New constraint added successfully');

    // Verify the constraint
    const constraintCheck = await client.query(`
      SELECT constraint_name, column_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_name = 'schedules' 
      AND constraint_name LIKE '%location%week%';
    `);
    
    console.log('Constraint verified:', constraintCheck.rows);

    // Check for any duplicate schedules that might exist
    console.log('\nChecking for duplicate schedules...');
    const duplicates = await client.query(`
      SELECT location, week_start_date, COUNT(*) as count
      FROM schedules
      GROUP BY location, week_start_date
      HAVING COUNT(*) > 1;
    `);

    if (duplicates.rows.length > 0) {
      console.log('WARNING: Found duplicate schedules that need to be resolved:');
      duplicates.rows.forEach(row => {
        console.log(`- Location: ${row.location}, Week: ${row.week_start_date}, Count: ${row.count}`);
      });
      console.log('\nYou may need to manually merge or remove duplicate schedules.');
    } else {
      console.log('No duplicate schedules found - migration complete!');
    }

  } catch (error) {
    console.error('Error updating constraint:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
updateSchedulesConstraint().catch(console.error);
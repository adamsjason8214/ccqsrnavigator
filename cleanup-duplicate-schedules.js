const { Client } = require('pg');
require('dotenv').config();

async function cleanupDuplicateSchedules() {
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

    // Find all duplicates
    console.log('\nFinding duplicate schedules...');
    const duplicates = await client.query(`
      SELECT location, week_start_date, COUNT(*) as count
      FROM schedules
      GROUP BY location, week_start_date
      HAVING COUNT(*) > 1
      ORDER BY location, week_start_date;
    `);

    console.log(`Found ${duplicates.rows.length} location/week combinations with duplicates`);

    for (const dup of duplicates.rows) {
      console.log(`\nProcessing duplicates for ${dup.location} - ${dup.week_start_date}`);
      
      // Get all schedules for this location/week
      const schedules = await client.query(`
        SELECT id, user_id, created_at, updated_at, schedule_data
        FROM schedules
        WHERE location = $1 AND week_start_date = $2
        ORDER BY updated_at DESC, created_at DESC;
      `, [dup.location, dup.week_start_date]);

      console.log(`  Found ${schedules.rows.length} schedules:`);
      schedules.rows.forEach((s, idx) => {
        let employeeCount = 0;
        try {
          const data = typeof s.schedule_data === 'string' ? JSON.parse(s.schedule_data) : s.schedule_data;
          employeeCount = Object.keys(data.schedule || {}).length;
        } catch (e) {
          console.log(`    Error parsing schedule data for ID ${s.id}:`, e.message);
        }
        console.log(`  ${idx + 1}. ID: ${s.id}, User: ${s.user_id}, Updated: ${s.updated_at}, Employees: ${employeeCount}`);
      });

      // Keep the most recently updated one (first in the list)
      const keepId = schedules.rows[0].id;
      const deleteIds = schedules.rows.slice(1).map(s => s.id);

      console.log(`  Keeping schedule ID: ${keepId}`);
      console.log(`  Deleting schedule IDs: ${deleteIds.join(', ')}`);

      // Delete the duplicates
      if (deleteIds.length > 0) {
        const deleteResult = await client.query(`
          DELETE FROM schedules
          WHERE id = ANY($1::int[])
          RETURNING id;
        `, [deleteIds]);
        console.log(`  Deleted ${deleteResult.rows.length} duplicate schedules`);
      }
    }

    // Verify no more duplicates
    console.log('\nVerifying cleanup...');
    const checkDuplicates = await client.query(`
      SELECT location, week_start_date, COUNT(*) as count
      FROM schedules
      GROUP BY location, week_start_date
      HAVING COUNT(*) > 1;
    `);

    if (checkDuplicates.rows.length === 0) {
      console.log('✅ All duplicates cleaned up successfully!');
      
      // Now add the unique constraint
      console.log('\nAdding unique constraint...');
      await client.query(`
        ALTER TABLE schedules 
        ADD CONSTRAINT schedules_location_week_start_date_key 
        UNIQUE (location, week_start_date);
      `);
      console.log('✅ Unique constraint added successfully!');
    } else {
      console.log('❌ Still have duplicates:', checkDuplicates.rows);
    }

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
cleanupDuplicateSchedules().catch(console.error);
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_e0JRdGQ1WNgm@ep-odd-dew-aex0vnh8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function fixSchedulesTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // First, check if there's any data in the table
    const countResult = await client.query('SELECT COUNT(*) FROM schedules');
    console.log(`Current schedules in table: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      console.log('\nWARNING: There are existing schedules in the table.');
      console.log('This operation will delete them. Please backup if needed.');
      // In production, you'd want to migrate the data instead
    }
    
    console.log('\nAltering schedules table to use email as user_id...');
    
    // First, drop the foreign key constraint
    try {
      await client.query(`
        ALTER TABLE schedules 
        DROP CONSTRAINT IF EXISTS schedules_user_id_fkey
      `);
      console.log('✓ Dropped foreign key constraint');
    } catch (e) {
      console.log('Note: No foreign key constraint to drop');
    }
    
    // Drop the unique constraint if any
    try {
      await client.query(`
        ALTER TABLE schedules 
        DROP CONSTRAINT IF EXISTS schedules_user_id_location_week_start_date_key
      `);
      console.log('✓ Dropped unique constraint');
    } catch (e) {
      console.log('Note: No unique constraint to drop');
    }
    
    // Alter the user_id column to varchar
    await client.query(`
      ALTER TABLE schedules 
      ALTER COLUMN user_id TYPE VARCHAR(255) USING COALESCE(user_id::VARCHAR, '')
    `);
    console.log('✓ Changed user_id column to VARCHAR(255)');
    
    // Recreate the unique constraint
    await client.query(`
      ALTER TABLE schedules 
      ADD CONSTRAINT schedules_user_id_location_week_start_date_key 
      UNIQUE (user_id, location, week_start_date)
    `);
    console.log('✓ Recreated unique constraint');
    
    // Verify the change
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'schedules' AND column_name = 'user_id'
    `;
    
    const result = await client.query(columnsQuery);
    console.log('\n✅ Table updated successfully!');
    console.log('New user_id column type:', result.rows[0].data_type);
    
    // Test with a sample insert
    console.log('\nTesting with sample data...');
    const testData = {
      user_id: 'test@example.com',
      location: 'Test Location',
      week_start_date: '2025-08-11',
      schedule_data: JSON.stringify({
        schedule: {},
        sales: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
      })
    };
    
    await client.query(`
      INSERT INTO schedules (user_id, location, week_start_date, schedule_data) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, location, week_start_date) 
      DO UPDATE SET 
        schedule_data = $4,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [testData.user_id, testData.location, testData.week_start_date, testData.schedule_data]);
    
    console.log('✓ Test insert successful');
    
    // Clean up test data
    await client.query('DELETE FROM schedules WHERE user_id = $1', [testData.user_id]);
    console.log('✓ Test data cleaned up');
    
    console.log('\n🎉 Schedules table has been successfully updated to accept email addresses as user_id!');
    
  } catch (error) {
    console.error('Error:', error);
    console.error('\nIf you see a permission error, you may need to contact your database administrator.');
  } finally {
    await client.end();
  }
}

fixSchedulesTable();
const { Client } = require('pg');
require('dotenv').config();

async function updatePrepListsSchema() {
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

    // First, check if the table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'prep_lists'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Creating prep_lists table...');
      await client.query(`
        CREATE TABLE prep_lists (
          id SERIAL PRIMARY KEY,
          location VARCHAR(255) NOT NULL,
          prep_date DATE NOT NULL,
          items JSONB NOT NULL DEFAULT '{}',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(location, prep_date)
        );
      `);
      console.log('prep_lists table created successfully');
    } else {
      console.log('prep_lists table exists, updating schema...');
      
      // Drop the old constraint if it exists
      try {
        await client.query(`
          ALTER TABLE prep_lists 
          DROP CONSTRAINT IF EXISTS prep_lists_user_id_location_prep_date_key;
        `);
        console.log('Old constraint dropped');
      } catch (error) {
        console.log('No old constraint to drop or error:', error.message);
      }

      // Check if user_id column exists and handle migration
      const hasUserId = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'prep_lists' AND column_name = 'user_id'
        );
      `);

      if (hasUserId.rows[0].exists) {
        console.log('Migrating data to remove user dependency...');
        
        // First, let's see what data we have
        const existingData = await client.query(`
          SELECT location, prep_date, COUNT(*) as count
          FROM prep_lists
          GROUP BY location, prep_date
          HAVING COUNT(*) > 1
          ORDER BY location, prep_date;
        `);

        if (existingData.rows.length > 0) {
          console.log('Found duplicate prep lists for same location/date:');
          for (const row of existingData.rows) {
            console.log(`- Location: ${row.location}, Date: ${row.prep_date}, Count: ${row.count}`);
            
            // Merge duplicate prep lists
            const preps = await client.query(`
              SELECT id, items, notes, updated_at
              FROM prep_lists
              WHERE location = $1 AND prep_date = $2
              ORDER BY updated_at DESC;
            `, [row.location, row.prep_date]);

            if (preps.rows.length > 1) {
              // Keep the most recent one and merge items
              const keepId = preps.rows[0].id;
              let mergedItems = preps.rows[0].items || {};
              let mergedNotes = preps.rows[0].notes || '';

              // Merge items from other entries
              for (let i = 1; i < preps.rows.length; i++) {
                const otherItems = preps.rows[i].items || {};
                // Merge items, preferring non-empty values
                for (const [key, value] of Object.entries(otherItems)) {
                  if (!mergedItems[key] || (value && Object.keys(value).length > 0)) {
                    mergedItems[key] = value;
                  }
                }
                if (preps.rows[i].notes && !mergedNotes.includes(preps.rows[i].notes)) {
                  mergedNotes += (mergedNotes ? '\n' : '') + preps.rows[i].notes;
                }
              }

              // Update the keeper with merged data
              await client.query(`
                UPDATE prep_lists
                SET items = $1, notes = $2
                WHERE id = $3;
              `, [JSON.stringify(mergedItems), mergedNotes, keepId]);

              // Delete the duplicates
              const deleteIds = preps.rows.slice(1).map(p => p.id);
              await client.query(`
                DELETE FROM prep_lists
                WHERE id = ANY($1::int[]);
              `, [deleteIds]);
              
              console.log(`  Merged ${preps.rows.length} entries into one`);
            }
          }
        }

        // Drop the user_id column
        await client.query(`
          ALTER TABLE prep_lists DROP COLUMN IF EXISTS user_id;
        `);
        console.log('Removed user_id column');
      }

      // Add the new constraint
      console.log('Adding new location-based constraint...');
      await client.query(`
        ALTER TABLE prep_lists 
        ADD CONSTRAINT prep_lists_location_prep_date_key 
        UNIQUE (location, prep_date);
      `);
      console.log('New constraint added successfully');
    }

    // Verify the final schema
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prep_lists'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nFinal prep_lists schema:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
updatePrepListsSchema().catch(console.error);
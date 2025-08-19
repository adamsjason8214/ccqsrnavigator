const { Client } = require('pg');
require('dotenv').config();

async function createParListsTable() {
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

    // Check if the table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'par_lists'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('par_lists table already exists');
      
      // Show current schema
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'par_lists'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nCurrent par_lists schema:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('Creating par_lists table...');
      await client.query(`
        CREATE TABLE par_lists (
          id SERIAL PRIMARY KEY,
          location VARCHAR(255) NOT NULL,
          day_of_week VARCHAR(10) NOT NULL,
          par_levels JSONB NOT NULL DEFAULT '{}',
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(location, day_of_week)
        );
      `);
      console.log('par_lists table created successfully');

      // Create an index for faster lookups
      await client.query(`
        CREATE INDEX idx_par_lists_location ON par_lists(location);
      `);
      console.log('Index created on location column');

      // Verify the schema
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'par_lists'
        ORDER BY ordinal_position;
      `);
      
      console.log('\npar_lists schema:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
createParListsTable().catch(console.error);
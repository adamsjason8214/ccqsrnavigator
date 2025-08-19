const { Client } = require('pg');
require('dotenv').config();

async function createEmployeesTable() {
  // Use the same connection config as the Netlify functions
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

    // Create the employees table
    const createTableQuery = `
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(100),
        location_id VARCHAR(100),
        brand VARCHAR(100),
        pay_type VARCHAR(50),
        pay_rate DECIMAL(10,2),
        availability TEXT,
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableQuery);
    console.log('Employees table created successfully!');

    // Verify the table was created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employees';
    `;

    const result = await client.query(verifyQuery);
    if (result.rows.length > 0) {
      console.log('Verified: employees table exists in the database');
    }

  } catch (error) {
    if (error.code === '42P07') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error.message);
      throw error;
    }
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
createEmployeesTable().catch(console.error);
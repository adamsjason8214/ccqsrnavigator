const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    switch (event.httpMethod) {
      case 'GET':
        const { location, prep_date, date_range } = event.queryStringParameters || {};
        let query = 'SELECT * FROM prep_lists WHERE 1=1';
        const params = [];
        let paramCount = 0;
        
        if (location) {
          params.push(location);
          query += ` AND location = $${++paramCount}`;
        }
        if (prep_date) {
          params.push(prep_date);
          query += ` AND prep_date = $${++paramCount}`;
        }
        if (date_range) {
          // Get prep lists for the next X days
          params.push(date_range);
          query += ` AND prep_date >= CURRENT_DATE AND prep_date <= CURRENT_DATE + INTERVAL '$${++paramCount} days'`;
        }
        
        query += ' ORDER BY prep_date ASC, created_at DESC';
        
        const result = await client.query(query, params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };

      case 'POST':
        const prepData = JSON.parse(event.body);
        const { location: loc, prep_date: prepDate, items, notes } = prepData;
        
        if (!loc || !prepDate) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Location and prep_date are required' })
          };
        }
        
        // Upsert - update if exists, insert if not
        const upsertResult = await client.query(`
          INSERT INTO prep_lists (location, prep_date, items, notes) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (location, prep_date) 
          DO UPDATE SET 
            items = $3,
            notes = $4,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [loc, prepDate, items, notes]);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(upsertResult.rows[0])
        };

      case 'PUT':
        const updateData = JSON.parse(event.body);
        const { id, items: updatedItems, notes: updatedNotes } = updateData;
        
        const updateResult = await client.query(`
          UPDATE prep_lists 
          SET items = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *
        `, [updatedItems, updatedNotes, id]);
        
        if (updateResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Prep list not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updateResult.rows[0])
        };

      case 'DELETE':
        const deleteId = event.queryStringParameters?.id;
        if (!deleteId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Prep list ID required' })
          };
        }
        
        const deleteResult = await client.query('DELETE FROM prep_lists WHERE id = $1 RETURNING id', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Prep list not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Prep list deleted successfully' })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  } finally {
    await client.end();
  }
};
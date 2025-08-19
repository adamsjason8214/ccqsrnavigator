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
    connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    switch (event.httpMethod) {
      case 'GET':
        const { user_id, location, inventory_date, inventory_type, latest } = event.queryStringParameters || {};
        let query = 'SELECT * FROM inventory WHERE 1=1';
        const params = [];
        let paramCount = 0;
        
        if (user_id) {
          params.push(user_id);
          query += ` AND user_id = $${++paramCount}`;
        }
        if (location) {
          params.push(location);
          query += ` AND location = $${++paramCount}`;
        }
        if (inventory_date) {
          params.push(inventory_date);
          query += ` AND inventory_date = $${++paramCount}`;
        }
        if (inventory_type) {
          params.push(inventory_type);
          query += ` AND inventory_type = $${++paramCount}`;
        }
        
        query += ' ORDER BY inventory_date DESC, created_at DESC';
        
        // If latest flag is set, return only the most recent inventory for each type
        if (latest === 'true') {
          query = `
            SELECT DISTINCT ON (location, inventory_type) *
            FROM inventory
            WHERE 1=1
            ${user_id ? `AND user_id = $1` : ''}
            ${location ? `AND location = $${user_id ? 2 : 1}` : ''}
            ORDER BY location, inventory_type, inventory_date DESC
          `;
        }
        
        const result = await client.query(query, params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };

      case 'POST':
        const invData = JSON.parse(event.body);
        const { 
          user_id: userId, 
          location: loc, 
          inventory_date: invDate, 
          inventory_type: invType,
          items,
          total_value,
          notes 
        } = invData;
        
        const insertResult = await client.query(`
          INSERT INTO inventory (user_id, location, inventory_date, inventory_type, items, total_value, notes) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [userId, loc, invDate, invType, items, total_value, notes]);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(insertResult.rows[0])
        };

      case 'PUT':
        const updateData = JSON.parse(event.body);
        const { id, items: updatedItems, total_value: updatedValue, notes: updatedNotes } = updateData;
        
        const updateResult = await client.query(`
          UPDATE inventory 
          SET items = $1, total_value = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING *
        `, [updatedItems, updatedValue, updatedNotes, id]);
        
        if (updateResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Inventory not found' })
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
            body: JSON.stringify({ error: 'Inventory ID required' })
          };
        }
        
        const deleteResult = await client.query('DELETE FROM inventory WHERE id = $1 RETURNING id', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Inventory not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Inventory deleted successfully' })
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
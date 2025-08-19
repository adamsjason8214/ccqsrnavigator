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
        const { user_id, location, week_start_date } = event.queryStringParameters || {};
        let query = 'SELECT * FROM schedules WHERE 1=1';
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
        if (week_start_date) {
          params.push(week_start_date);
          query += ` AND week_start_date = $${++paramCount}`;
        }
        
        query += ' ORDER BY week_start_date DESC, created_at DESC';
        
        const result = await client.query(query, params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };

      case 'POST':
        const scheduleData = JSON.parse(event.body);
        const { location: loc, week_start_date: weekStart, schedule_data, updated_by } = scheduleData;
        
        // Validate required fields
        if (!loc || !weekStart || !schedule_data) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Location, week_start_date, and schedule_data are required' })
          };
        }
        
        // Check if schedule already exists for this location/week
        const existingSchedule = await client.query(
          'SELECT id FROM schedules WHERE location = $1 AND week_start_date = $2',
          [loc, weekStart]
        );
        
        if (existingSchedule.rows.length > 0) {
          // Update existing schedule
          const updateResult = await client.query(`
            UPDATE schedules 
            SET schedule_data = $1, 
                updated_at = CURRENT_TIMESTAMP,
                user_id = $2
            WHERE location = $3 AND week_start_date = $4
            RETURNING *
          `, [schedule_data, updated_by || 'system', loc, weekStart]);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updateResult.rows[0])
          };
        } else {
          // Insert new schedule
          const insertResult = await client.query(`
            INSERT INTO schedules (user_id, location, week_start_date, schedule_data) 
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `, [updated_by || 'system', loc, weekStart, schedule_data]);
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(insertResult.rows[0])
          };
        }

      case 'PUT':
        const updateData = JSON.parse(event.body);
        const { id, schedule_data: updatedData } = updateData;
        
        const updateResult = await client.query(`
          UPDATE schedules 
          SET schedule_data = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [updatedData, id]);
        
        if (updateResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Schedule not found' })
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
            body: JSON.stringify({ error: 'Schedule ID required' })
          };
        }
        
        const deleteResult = await client.query('DELETE FROM schedules WHERE id = $1 RETURNING id', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Schedule not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Schedule deleted successfully' })
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
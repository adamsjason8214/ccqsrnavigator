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
        const { user_id, location, checklist_type, submission_status } = event.queryStringParameters || {};
        let query = 'SELECT * FROM checklist_submissions WHERE 1=1';
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
        if (checklist_type) {
          params.push(checklist_type);
          query += ` AND checklist_type = $${++paramCount}`;
        }
        if (submission_status) {
          params.push(submission_status);
          query += ` AND submission_status = $${++paramCount}`;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await client.query(query, params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };

      case 'POST':
        const checklistData = JSON.parse(event.body);
        const { 
          user_id: userId, 
          location: loc, 
          checklist_type: checkType,
          checklist_data: checkData,
          basecamp_project_id,
          submission_status: submissionStatus = 'pending'
        } = checklistData;
        
        // Insert the checklist submission record
        const insertResult = await client.query(`
          INSERT INTO checklist_submissions 
          (user_id, location, checklist_type, checklist_data, basecamp_project_id, submission_status) 
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [userId, loc, checkType, checkData, basecamp_project_id, submissionStatus]);
        
        // If this is being submitted to Basecamp, we'll track it
        // The actual Basecamp submission would happen in the frontend
        // This just tracks that it was submitted
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            ...insertResult.rows[0],
            message: 'Checklist submission tracked. Remember to clear local checklist data after Basecamp submission.'
          })
        };

      case 'PUT':
        // Update submission status (e.g., from 'pending' to 'sent')
        const updateData = JSON.parse(event.body);
        const { id, submission_status: newStatus, submitted_at } = updateData;
        
        const updateResult = await client.query(`
          UPDATE checklist_submissions 
          SET submission_status = $1, submitted_at = $2
          WHERE id = $3
          RETURNING *
        `, [newStatus, submitted_at || new Date(), id]);
        
        if (updateResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Checklist submission not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updateResult.rows[0])
        };

      case 'DELETE':
        // Clean up old submissions if needed
        const deleteParams = event.queryStringParameters || {};
        
        if (deleteParams.older_than_days) {
          // Delete submissions older than X days
          const days = parseInt(deleteParams.older_than_days);
          const deleteResult = await client.query(`
            DELETE FROM checklist_submissions 
            WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
            AND submission_status = 'sent'
            RETURNING id
          `);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              message: `Deleted ${deleteResult.rowCount} old checklist submissions` 
            })
          };
        }
        
        // Delete specific submission
        const deleteId = deleteParams.id;
        if (!deleteId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Checklist ID or older_than_days parameter required' })
          };
        }
        
        const deleteResult = await client.query('DELETE FROM checklist_submissions WHERE id = $1 RETURNING id', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Checklist submission not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Checklist submission deleted successfully' })
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
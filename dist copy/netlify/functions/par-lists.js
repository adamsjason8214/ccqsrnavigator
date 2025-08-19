const { Client } = require('pg');

// Role to security code mapping
const roleToSecurityCode = {
  'super_admin': 5,
  'admin': 4,
  'general_manager': 3,
  'manager': 2,
  'staff': 1
};

// Helper function to get security code from role string
function getSecurityCode(role) {
  // If it's already a number, return it
  if (!isNaN(parseInt(role))) {
    return parseInt(role);
  }
  // Otherwise map the role string to security code
  return roleToSecurityCode[role] || 1;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-current-user-email, x-current-user-role',
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
    
    // Get user info from headers for permission checking
    const currentUserEmail = event.headers['x-current-user-email'];
    const currentUserRole = event.headers['x-current-user-role'];
    
    console.log('Par Lists - User email:', currentUserEmail);
    console.log('Par Lists - User role:', currentUserRole);
    console.log('Par Lists - Security code:', getSecurityCode(currentUserRole));
    
    switch (event.httpMethod) {
      case 'GET':
        const { location, day_of_week } = event.queryStringParameters || {};
        let query = 'SELECT * FROM par_lists WHERE 1=1';
        const params = [];
        let paramCount = 0;
        
        if (location) {
          params.push(location);
          query += ` AND location = $${++paramCount}`;
        }
        if (day_of_week) {
          params.push(day_of_week);
          query += ` AND day_of_week = $${++paramCount}`;
        }
        
        query += ' ORDER BY day_of_week, created_at DESC';
        
        const result = await client.query(query, params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };

      case 'POST':
      case 'PUT':
        // Check permissions - only security code 3+ can modify par lists
        const userSecurityCode = getSecurityCode(currentUserRole);
        console.log('POST/PUT - Checking permissions:');
        console.log('- Raw role value:', currentUserRole);
        console.log('- Type of role:', typeof currentUserRole);
        console.log('- Calculated security code:', userSecurityCode);
        console.log('- Permission check result:', userSecurityCode >= 3);
        
        if (!currentUserRole || userSecurityCode < 3) {
          console.log('Permission denied - returning 403');
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ 
              error: 'Only General Managers (3), Admins (4), and Super Admins (5) can modify par levels',
              debug: {
                role: currentUserRole,
                securityCode: userSecurityCode,
                hasRole: !!currentUserRole
              }
            })
          };
        }
        
        const parData = JSON.parse(event.body);
        const { location: loc, day_of_week: dayOfWeek, par_levels: parLevels } = parData;
        
        if (!loc || !dayOfWeek) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Location and day_of_week are required' })
          };
        }
        
        // Upsert - update if exists, insert if not
        const upsertResult = await client.query(`
          INSERT INTO par_lists (location, day_of_week, par_levels, created_by) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (location, day_of_week) 
          DO UPDATE SET 
            par_levels = $3,
            created_by = $4,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [loc, dayOfWeek, parLevels, currentUserEmail]);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(upsertResult.rows[0])
        };

      case 'DELETE':
        // Check permissions - only security code 3+ can delete par lists
        const deleteUserSecurityCode = getSecurityCode(currentUserRole);
        if (!currentUserRole || deleteUserSecurityCode < 3) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Only General Managers (3), Admins (4), and Super Admins (5) can delete par levels' })
          };
        }
        
        const deleteId = event.queryStringParameters?.id;
        if (!deleteId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Par list ID required' })
          };
        }
        
        const deleteResult = await client.query('DELETE FROM par_lists WHERE id = $1 RETURNING id', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Par list not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Par list deleted successfully' })
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
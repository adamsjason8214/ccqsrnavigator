const { Client } = require('pg');

// Security code mapping - must match frontend
const SECURITY_CODES = {
  super_admin: 5,
  admin: 4,
  general_manager: 3,
  manager: 2,
  staff: 1
};

// Get security code for a role (handles both string and numeric roles)
function getSecurityCode(role) {
  // If role is a number, convert it directly
  if (typeof role === 'number' || !isNaN(parseInt(role))) {
    const numericRole = parseInt(role);
    // If it's already a security code (1-5), return it
    if (numericRole >= 1 && numericRole <= 5) {
      return numericRole;
    }
    // If it's 0 or invalid, return 0
    return 0;
  }
  
  // Otherwise treat as string role name
  return SECURITY_CODES[role] || 0;
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Current-User-Email, X-Current-User-Role',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    // Get current user info from headers
    const currentUserEmail = event.headers['x-current-user-email'] || 
                           event.headers['X-Current-User-Email'];
    const currentUserRole = event.headers['x-current-user-role'] || 
                          event.headers['X-Current-User-Role'];
    
    console.log('Employee API - Current user:', { currentUserEmail, currentUserRole });
    
    switch (event.httpMethod) {
      case 'GET': {
        // Get employees - filter by location if provided
        const { location_id } = event.queryStringParameters || {};
        
        let query = 'SELECT id, name, brand, location_id, role, pay_type, pay_rate, email, availability, notes, created_at, updated_at FROM employees';
        const params = [];
        
        if (location_id) {
          query += ' WHERE location_id = $1';
          params.push(location_id);
        }
        
        query += ' ORDER BY name ASC';
        
        const result = await client.query(query, params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }

      case 'POST': {
        // Create new employee
        if (!currentUserEmail || !currentUserRole) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized: Missing user credentials' })
          };
        }
        
        // Check if user has permission to create employees (security code >= 3)
        const currentUserSecurityCode = getSecurityCode(currentUserRole);
        if (currentUserSecurityCode < 3) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ 
              error: 'Forbidden: You do not have permission to create employees',
              details: `Your security code: ${currentUserSecurityCode}, Required: 3`
            })
          };
        }
        
        const employeeData = JSON.parse(event.body);
        const { name, brand, location_id, role, pay_type, pay_rate, email, availability, notes } = employeeData;
        
        // Validate required fields
        if (!name || !brand || !location_id || !role || !pay_type || pay_rate === undefined) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields: name, brand, location_id, role, pay_type, and pay_rate are required' })
          };
        }
        
        // If current user is a General Manager (security code 3), verify location permissions
        if (currentUserSecurityCode === 3) {
          const currentUserQuery = await client.query(
            'SELECT locations FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
            [currentUserEmail]
          );
          
          if (currentUserQuery.rows.length === 0) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ error: 'Current user not found' })
            };
          }
          
          const currentUserLocations = currentUserQuery.rows[0].locations || [];
          if (!currentUserLocations.includes(location_id)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ 
                error: 'Forbidden: You can only create employees for locations you are assigned to',
                details: `Your locations: ${currentUserLocations.join(', ')}`
              })
            };
          }
        }
        
        const insertResult = await client.query(
          `INSERT INTO employees (name, brand, location_id, role, pay_type, pay_rate, email, availability, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING id, name, brand, location_id, role, pay_type, pay_rate, email, availability, notes, created_at`,
          [name, brand, location_id, role, pay_type, pay_rate, email || null, availability || null, notes || null]
        );
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(insertResult.rows[0])
        };
      }

      case 'PUT': {
        // Update employee
        if (!currentUserEmail || !currentUserRole) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized: Missing user credentials' })
          };
        }
        
        // Check if user has permission to update employees (security code >= 3)
        const currentUserSecurityCode = getSecurityCode(currentUserRole);
        if (currentUserSecurityCode < 3) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ 
              error: 'Forbidden: You do not have permission to update employees',
              details: `Your security code: ${currentUserSecurityCode}, Required: 3`
            })
          };
        }
        
        const { id, ...updateData } = JSON.parse(event.body);
        
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Employee ID required for update' })
          };
        }
        
        // If current user is a General Manager, verify location permissions
        if (currentUserSecurityCode === 3) {
          // First, get the employee's current location
          const employeeQuery = await client.query(
            'SELECT location_id FROM employees WHERE id = $1',
            [id]
          );
          
          if (employeeQuery.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Employee not found' })
            };
          }
          
          const currentLocation = employeeQuery.rows[0].location_id;
          const newLocation = updateData.location_id || currentLocation;
          
          // Get GM's locations
          const currentUserQuery = await client.query(
            'SELECT locations FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
            [currentUserEmail]
          );
          
          if (currentUserQuery.rows.length === 0) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ error: 'Current user not found' })
            };
          }
          
          const currentUserLocations = currentUserQuery.rows[0].locations || [];
          
          // Check if GM has permission for both current and new locations
          if (!currentUserLocations.includes(currentLocation) || !currentUserLocations.includes(newLocation)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ 
                error: 'Forbidden: You can only update employees in locations you are assigned to',
                details: `Your locations: ${currentUserLocations.join(', ')}`
              })
            };
          }
        }
        
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;
        
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && key !== 'id') {
            updateFields.push(`${key} = $${paramCount}`);
            updateValues.push(value);
            paramCount++;
          }
        });
        
        if (updateFields.length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'No fields to update' })
          };
        }
        
        updateValues.push(id);
        
        const updateQuery = `
          UPDATE employees 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount}
          RETURNING id, name, brand, location_id, role, pay_type, pay_rate, email, availability, notes, created_at, updated_at
        `;
        
        const updateResult = await client.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Employee not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updateResult.rows[0])
        };
      }

      case 'DELETE': {
        // Delete employee
        if (!currentUserEmail || !currentUserRole) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized: Missing user credentials' })
          };
        }
        
        // Check if user has permission to delete employees (security code >= 3)
        const currentUserSecurityCode = getSecurityCode(currentUserRole);
        if (currentUserSecurityCode < 3) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ 
              error: 'Forbidden: You do not have permission to delete employees',
              details: `Your security code: ${currentUserSecurityCode}, Required: 3`
            })
          };
        }
        
        const deleteId = event.queryStringParameters?.id;
        if (!deleteId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Employee ID required' })
          };
        }
        
        // If current user is a General Manager, verify location permissions
        if (currentUserSecurityCode === 3) {
          // First, get the employee's location
          const employeeQuery = await client.query(
            'SELECT location_id FROM employees WHERE id = $1',
            [deleteId]
          );
          
          if (employeeQuery.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Employee not found' })
            };
          }
          
          const employeeLocation = employeeQuery.rows[0].location_id;
          
          // Get GM's locations
          const currentUserQuery = await client.query(
            'SELECT locations FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
            [currentUserEmail]
          );
          
          if (currentUserQuery.rows.length === 0) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ error: 'Current user not found' })
            };
          }
          
          const currentUserLocations = currentUserQuery.rows[0].locations || [];
          
          if (!currentUserLocations.includes(employeeLocation)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ 
                error: 'Forbidden: You can only delete employees from locations you are assigned to',
                details: `Your locations: ${currentUserLocations.join(', ')}`
              })
            };
          }
        }
        
        const deleteResult = await client.query('DELETE FROM employees WHERE id = $1 RETURNING id', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Employee not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Employee deleted successfully' })
        };
      }

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
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        type: error.constructor.name
      })
    };
  } finally {
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing database connection:', endError);
    }
  }
};
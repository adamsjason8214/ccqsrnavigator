const { Client } = require('pg');

// Security code mapping - must match frontend
const SECURITY_CODES = {
  super_admin: 5,
  admin: 4,
  general_manager: 3,
  manager: 2,
  staff: 1
};

// Get security code for a role
function getSecurityCode(role) {
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
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    switch (event.httpMethod) {
      case 'GET': {
        // Get all users or specific user by email
        const email = event.queryStringParameters?.email;
        let query = 'SELECT id, email, name, role, password, brands, locations, created_at FROM users';
        const params = [];
        
        if (email) {
          query += ' WHERE email = $1';
          params.push(email);
        }
        
        const result = await client.query(query, params);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }

      case 'POST': {
        // Create new user
        console.log('POST request body:', event.body);
        
        // Get current user info from headers (set by frontend)
        console.log('All headers received:', JSON.stringify(event.headers, null, 2));
        
        // Try multiple header variations due to case sensitivity issues
        const currentUserEmail = event.headers['x-current-user-email'] || 
                               event.headers['X-Current-User-Email'] || 
                               event.headers['X-CURRENT-USER-EMAIL'];
        const currentUserRole = event.headers['x-current-user-role'] || 
                              event.headers['X-Current-User-Role'] || 
                              event.headers['X-CURRENT-USER-ROLE'];
        
        console.log('Extracted user info:', { currentUserEmail, currentUserRole });
        
        if (!currentUserEmail || !currentUserRole) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized: Missing user credentials' })
          };
        }
        
        let userData;
        try {
          userData = JSON.parse(event.body);
          console.log('Parsed user data:', userData);
        } catch (parseError) {
          console.error('Error parsing request body:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid request body' })
          };
        }
        
        const { email, name, role, password, brands, locations } = userData;
        
        // Check permissions: current user's security code must be >= target user's security code
        const currentUserSecurityCode = getSecurityCode(currentUserRole);
        const targetUserSecurityCode = getSecurityCode(role);
        
        console.log('Permission check:', {
          currentUser: currentUserEmail,
          currentRole: currentUserRole,
          currentSecurityCode: currentUserSecurityCode,
          targetRole: role,
          targetSecurityCode: targetUserSecurityCode
        });
        
        if (currentUserSecurityCode < targetUserSecurityCode) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ 
              error: 'Forbidden: You cannot create users with a higher security level than your own',
              details: `Your security code: ${currentUserSecurityCode}, Target security code: ${targetUserSecurityCode}`
            })
          };
        }
        
        // If current user is a General Manager (security code 3), check brand/location permissions
        if (currentUserSecurityCode === 3) {
          // Get current user's brands and locations
          console.log('POST - Querying for GM user with email:', currentUserEmail);
          
          // Try the query with case-insensitive matching and handle potential whitespace
          let currentUserQuery = await client.query(
            'SELECT brands, locations FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
            [currentUserEmail]
          );
          
          console.log('POST - Query result rows:', currentUserQuery.rows.length);
          
          if (currentUserQuery.rows.length === 0) {
            // Debug: show all emails in database
            const debugQuery = await client.query('SELECT email FROM users LIMIT 10');
            console.log('POST - Sample emails in DB:', debugQuery.rows.map(r => r.email));
            
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ 
                error: 'Current user not found',
                details: `Email searched: '${currentUserEmail}'`,
                debug: 'Check Netlify function logs for more details'
              })
            };
          }
          
          const currentUserBrands = currentUserQuery.rows[0].brands || [];
          const currentUserLocations = currentUserQuery.rows[0].locations || [];
          
          // Parse the target user's brands and locations
          const targetBrands = typeof brands === 'string' ? JSON.parse(brands) : brands;
          const targetLocations = typeof locations === 'string' ? JSON.parse(locations) : locations;
          
          // Check if GM has permission for all target brands
          if (Array.isArray(targetBrands) && targetBrands.length > 0) {
            const hasAllBrandPermissions = targetBrands.every(brand => 
              currentUserBrands.includes(brand)
            );
            
            if (!hasAllBrandPermissions) {
              return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                  error: 'Forbidden: You can only create users for brands you are assigned to',
                  details: `Your brands: ${currentUserBrands.join(', ')}, Requested brands: ${targetBrands.join(', ')}`
                })
              };
            }
          }
          
          // Check if GM has permission for all target locations
          if (Array.isArray(targetLocations) && targetLocations.length > 0) {
            const hasAllLocationPermissions = targetLocations.every(location => 
              currentUserLocations.includes(location)
            );
            
            if (!hasAllLocationPermissions) {
              return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                  error: 'Forbidden: You can only create users for locations you are assigned to',
                  details: `Your locations: ${currentUserLocations.join(', ')}, Requested locations: ${targetLocations.join(', ')}`
                })
              };
            }
          }
        }
        
        // Validate required fields
        if (!email || !name || !role || !password) {
          console.error('Missing required fields:', { email: !!email, name: !!name, role: !!role, password: !!password });
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields: email, name, role, and password are required' })
          };
        }
        
        // Check if user already exists
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'User with this email already exists' })
          };
        }
        
        console.log('Inserting user with data:', { email, name, role, brands, locations });
        
        const insertResult = await client.query(
          `INSERT INTO users (email, name, role, password, brands, locations) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING id, email, name, role, brands, locations, created_at`,
          [email, name, role, password, brands, locations]
        );
        
        console.log('User created successfully:', insertResult.rows[0]);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(insertResult.rows[0])
        };
      }

      case 'PUT': {
        // Update user
        
        // Get current user info from headers
        console.log('PUT - All headers received:', JSON.stringify(event.headers, null, 2));
        
        // Try multiple header variations due to case sensitivity issues
        const currentUserEmail = event.headers['x-current-user-email'] || 
                               event.headers['X-Current-User-Email'] || 
                               event.headers['X-CURRENT-USER-EMAIL'];
        const currentUserRole = event.headers['x-current-user-role'] || 
                              event.headers['X-Current-User-Role'] || 
                              event.headers['X-CURRENT-USER-ROLE'];
        
        console.log('PUT - Extracted user info:', { currentUserEmail, currentUserRole });
        
        if (!currentUserEmail || !currentUserRole) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized: Missing user credentials' })
          };
        }
        
        const { id, email: updateEmail, ...updateData } = JSON.parse(event.body);
        
        // Check current user's security code
        const currentUserSecurityCode = getSecurityCode(currentUserRole);
        
        // If role is being updated, check permissions
        if (updateData.role) {
          const targetUserSecurityCode = getSecurityCode(updateData.role);
          
          console.log('Update permission check:', {
            currentUser: currentUserEmail,
            currentRole: currentUserRole,
            currentSecurityCode: currentUserSecurityCode,
            targetRole: updateData.role,
            targetSecurityCode: targetUserSecurityCode
          });
          
          if (currentUserSecurityCode < targetUserSecurityCode) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ 
                error: 'Forbidden: You cannot assign a role with a higher security level than your own',
                details: `Your security code: ${currentUserSecurityCode}, Target security code: ${targetUserSecurityCode}`
              })
            };
          }
        }
        
        // If current user is a General Manager (security code 3), check brand/location permissions
        if (currentUserSecurityCode === 3) {
          // Get current user's brands and locations
          console.log('POST - Querying for GM user with email:', currentUserEmail);
          
          // Try the query with case-insensitive matching and handle potential whitespace
          let currentUserQuery = await client.query(
            'SELECT brands, locations FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
            [currentUserEmail]
          );
          
          console.log('POST - Query result rows:', currentUserQuery.rows.length);
          
          if (currentUserQuery.rows.length === 0) {
            // Debug: show all emails in database
            const debugQuery = await client.query('SELECT email FROM users LIMIT 10');
            console.log('POST - Sample emails in DB:', debugQuery.rows.map(r => r.email));
            
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ 
                error: 'Current user not found',
                details: `Email searched: '${currentUserEmail}'`,
                debug: 'Check Netlify function logs for more details'
              })
            };
          }
          
          const currentUserBrands = currentUserQuery.rows[0].brands || [];
          const currentUserLocations = currentUserQuery.rows[0].locations || [];
          
          // If brands are being updated, check permissions
          if (updateData.brands) {
            const targetBrands = typeof updateData.brands === 'string' ? JSON.parse(updateData.brands) : updateData.brands;
            
            if (Array.isArray(targetBrands) && targetBrands.length > 0) {
              const hasAllBrandPermissions = targetBrands.every(brand => 
                currentUserBrands.includes(brand)
              );
              
              if (!hasAllBrandPermissions) {
                return {
                  statusCode: 403,
                  headers,
                  body: JSON.stringify({ 
                    error: 'Forbidden: You can only assign users to brands you are assigned to',
                    details: `Your brands: ${currentUserBrands.join(', ')}, Requested brands: ${targetBrands.join(', ')}`
                  })
                };
              }
            }
          }
          
          // If locations are being updated, check permissions
          if (updateData.locations) {
            const targetLocations = typeof updateData.locations === 'string' ? JSON.parse(updateData.locations) : updateData.locations;
            
            if (Array.isArray(targetLocations) && targetLocations.length > 0) {
              const hasAllLocationPermissions = targetLocations.every(location => 
                currentUserLocations.includes(location)
              );
              
              if (!hasAllLocationPermissions) {
                return {
                  statusCode: 403,
                  headers,
                  body: JSON.stringify({ 
                    error: 'Forbidden: You can only assign users to locations you are assigned to',
                    details: `Your locations: ${currentUserLocations.join(', ')}, Requested locations: ${targetLocations.join(', ')}`
                  })
                };
              }
            }
          }
          
          // Also check the existing user's brands/locations to ensure GM has permission to edit them
          const targetUserEmail = updateEmail || id;
          const targetUserQuery = await client.query(
            'SELECT brands, locations FROM users WHERE email = $1 OR id::text = $1',
            [targetUserEmail]
          );
          
          if (targetUserQuery.rows.length > 0) {
            const existingBrands = targetUserQuery.rows[0].brands || [];
            const existingLocations = targetUserQuery.rows[0].locations || [];
            
            // Check if GM has permission for the user's existing brands
            if (Array.isArray(existingBrands) && existingBrands.length > 0) {
              const hasPermissionForExistingBrands = existingBrands.some(brand => 
                currentUserBrands.includes(brand)
              );
              
              if (!hasPermissionForExistingBrands) {
                return {
                  statusCode: 403,
                  headers,
                  body: JSON.stringify({ 
                    error: 'Forbidden: You cannot edit users who are not assigned to any of your brands',
                    details: `This user is assigned to brands you don\'t have access to`
                  })
                };
              }
            }
            
            // Check if GM has permission for the user's existing locations
            if (Array.isArray(existingLocations) && existingLocations.length > 0) {
              const hasPermissionForExistingLocations = existingLocations.some(location => 
                currentUserLocations.includes(location)
              );
              
              if (!hasPermissionForExistingLocations) {
                return {
                  statusCode: 403,
                  headers,
                  body: JSON.stringify({ 
                    error: 'Forbidden: You cannot edit users who are not assigned to any of your locations',
                    details: `This user is assigned to locations you don\'t have access to`
                  })
                };
              }
            }
          }
        }
        
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;
        
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && key !== 'id' && key !== 'email') {
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
        
        // Determine if we're using ID or email for the WHERE clause
        let whereClause;
        if (id && !isNaN(parseInt(id))) {
          // If id is a valid number, use it
          updateValues.push(parseInt(id));
          whereClause = `WHERE id = $${paramCount}`;
        } else if (updateEmail || id) {
          // Otherwise use email (either from updateEmail or id field if it contains email)
          updateValues.push(updateEmail || id);
          whereClause = `WHERE email = $${paramCount}`;
        } else {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'User ID or email required for update' })
          };
        }
        
        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          ${whereClause}
          RETURNING id, email, name, role, brands, locations, created_at, updated_at
        `;
        
        const updateResult = await client.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updateResult.rows[0])
        };
      }

      case 'DELETE': {
        // Delete user
        const deleteId = event.queryStringParameters?.id;
        if (!deleteId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'User ID required' })
          };
        }
        
        const deleteResult = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'User deleted successfully' })
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
    console.error('Error stack:', error.stack);
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
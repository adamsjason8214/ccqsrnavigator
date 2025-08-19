const https = require('https');
const querystring = require('querystring');

// Basecamp OAuth configuration
const BASECAMP_CLIENT_ID = process.env.BASECAMP_CLIENT_ID || '10bd625f81072c1c1a309471bc11ad022b1fc77e';
const BASECAMP_CLIENT_SECRET = process.env.BASECAMP_CLIENT_SECRET || '041c451f0bcba58a18343aa35e5d8f2dfd2e44b7';
const BASECAMP_REDIRECT_URI = process.env.BASECAMP_REDIRECT_URI || 'https://ccqsrnavigator.netlify.app/';
const BASECAMP_ACCOUNT_ID = '6023243';
const BASECAMP_PROJECT_ID = '43545521';
const BASECAMP_VAULT_ID = '8971236791';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse the request
    const { action, code, state } = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    switch (action) {
      case 'authorize':
        // Step 1: Return the authorization URL
        const authUrl = `https://launchpad.37signals.com/authorization/new?` + querystring.stringify({
          type: 'web_server',
          client_id: BASECAMP_CLIENT_ID,
          redirect_uri: BASECAMP_REDIRECT_URI,
          state: state || 'checklist_submission'
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ authUrl })
        };

      case 'token':
        // Step 2: Exchange authorization code for access token
        if (!code) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Authorization code required' })
          };
        }

        const tokenData = await exchangeCodeForToken(code);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(tokenData)
        };

      case 'refresh':
        // Refresh an existing token
        const { refresh_token } = body;
        if (!refresh_token) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Refresh token required' })
          };
        }

        const refreshedData = await refreshAccessToken(refresh_token);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(refreshedData)
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Basecamp auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Authentication failed',
        details: error.message 
      })
    };
  }
};

// Exchange authorization code for access token
function exchangeCodeForToken(code) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      type: 'web_server',
      client_id: BASECAMP_CLIENT_ID,
      client_secret: BASECAMP_CLIENT_SECRET,
      redirect_uri: BASECAMP_REDIRECT_URI,
      code: code
    });

    const options = {
      hostname: 'launchpad.37signals.com',
      port: 443,
      path: '/authorization/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const tokenData = JSON.parse(data);
          if (tokenData.access_token) {
            // Store account info for later use
            tokenData.account_id = BASECAMP_ACCOUNT_ID;
            tokenData.project_id = BASECAMP_PROJECT_ID;
            tokenData.vault_id = BASECAMP_VAULT_ID;
            resolve(tokenData);
          } else {
            reject(new Error('No access token received'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Refresh an existing access token
function refreshAccessToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      type: 'refresh',
      client_id: BASECAMP_CLIENT_ID,
      client_secret: BASECAMP_CLIENT_SECRET,
      refresh_token: refreshToken
    });

    const options = {
      hostname: 'launchpad.37signals.com',
      port: 443,
      path: '/authorization/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const tokenData = JSON.parse(data);
          if (tokenData.access_token) {
            tokenData.account_id = BASECAMP_ACCOUNT_ID;
            tokenData.project_id = BASECAMP_PROJECT_ID;
            tokenData.vault_id = BASECAMP_VAULT_ID;
            resolve(tokenData);
          } else {
            reject(new Error('Token refresh failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
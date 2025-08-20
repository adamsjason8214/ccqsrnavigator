const https = require('https');
const querystring = require('querystring');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // OAuth configuration
  const CLIENT_ID = process.env.BASECAMP_CLIENT_ID || '10bd625f81072c1c1a309471bc11ad022b1fc77e';
  const CLIENT_SECRET = process.env.BASECAMP_CLIENT_SECRET || '041c451f0bcba58a18343aa35e5d8f2dfd2e44b7';
  const REDIRECT_URI = process.env.BASECAMP_REDIRECT_URI || 'https://ccqsrnavigator.netlify.app/.netlify/functions/basecamp-oauth-callback';

  // Handle the OAuth callback
  if (event.httpMethod === 'GET') {
    const { code, state } = event.queryStringParameters || {};
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No authorization code received' })
      };
    }

    try {
      // Exchange the authorization code for an access token
      const tokenData = querystring.stringify({
        type: 'web_server',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      });

      const tokenResponse = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'launchpad.37signals.com',
          path: '/authorization/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenData)
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.write(tokenData);
        req.end();
      });

      if (tokenResponse.status === 200) {
        const tokenInfo = JSON.parse(tokenResponse.data);
        
        // Store the access token (in production, store this securely)
        console.log('Access token received:', tokenInfo.access_token);
        
        // Redirect back to the app with success message
        return {
          statusCode: 302,
          headers: {
            ...headers,
            'Location': `https://ccqsrnavigator.netlify.app/?auth=success&token=${tokenInfo.access_token}`
          },
          body: ''
        };
      } else {
        throw new Error(`Token exchange failed: ${tokenResponse.data}`);
      }
    } catch (error) {
      console.error('OAuth error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
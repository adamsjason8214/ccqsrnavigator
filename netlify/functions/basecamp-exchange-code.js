const https = require('https');
const querystring = require('querystring');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code } = JSON.parse(event.body);
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Authorization code required' })
      };
    }

    // OAuth configuration
    const CLIENT_ID = process.env.BASECAMP_CLIENT_ID || '10bd625f81072c1c1a309471bc11ad022b1fc77e';
    const CLIENT_SECRET = process.env.BASECAMP_CLIENT_SECRET || '041c451f0bcba58a18343aa35e5d8f2dfd2e44b7';
    const REDIRECT_URI = process.env.BASECAMP_REDIRECT_URI || 'https://ccqsrnavigator.netlify.app/.netlify/functions/basecamp-oauth-callback';

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
      
      // Store the token in memory (or database in production)
      const tokenStorage = global.tokenStorage || new Map();
      global.tokenStorage = tokenStorage;
      tokenStorage.set('access_token', tokenInfo.access_token);
      tokenStorage.set('refresh_token', tokenInfo.refresh_token);
      
      console.log('Access token obtained successfully');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Authorization successful',
          access_token: tokenInfo.access_token,
          expires_in: tokenInfo.expires_in
        })
      };
    } else {
      console.error('Token exchange failed:', tokenResponse.data);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to exchange authorization code',
          details: tokenResponse.data 
        })
      };
    }
  } catch (error) {
    console.error('Error exchanging code:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
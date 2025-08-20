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
  const REDIRECT_URI = process.env.BASECAMP_REDIRECT_URI || 'https://ccqsrnavigator.netlify.app/.netlify/functions/basecamp-oauth-callback';

  if (event.httpMethod === 'GET') {
    // Generate the OAuth authorization URL
    const authUrl = `https://launchpad.37signals.com/authorization/new?` +
      `type=web_server&` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authUrl: authUrl,
        message: 'Redirect user to this URL to authorize Basecamp access'
      })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
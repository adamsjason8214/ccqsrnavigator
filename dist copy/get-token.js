#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');

// Configuration
const CLIENT_ID = '10bd625f81072c1c1a309471bc11ad022b1fc77e';
const CLIENT_SECRET = '041c451f0bcba58a18343aa35e5d8f2dfd2e44b7';
const REDIRECT_URI = 'https://ccqsrnavigator.netlify.app/';

// Get authorization URL
function getAuthUrl() {
    const authUrl = `https://launchpad.37signals.com/authorization/new?` + querystring.stringify({
        type: 'web_server',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: 'setup_token'
    });
    
    console.log('\n🔐 Basecamp Access Token Setup\n');
    console.log('1. Open this URL in your browser to authorize:');
    console.log('\n' + authUrl + '\n');
    console.log('2. After authorizing, you\'ll be redirected back to your app.');
    console.log('3. Copy the "code" parameter from the URL.');
    console.log('4. Run this script again with the code:');
    console.log('   node get-token.js YOUR_CODE_HERE\n');
}

// Exchange code for token
function exchangeToken(code) {
    const postData = querystring.stringify({
        type: 'web_server',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: CLIENT_SECRET,
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
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                
                if (response.access_token) {
                    console.log('\n✅ Success! Access token received:\n');
                    console.log('Access Token:', response.access_token);
                    console.log('\n📝 Now set this token as an environment variable on Netlify:\n');
                    console.log(`netlify env:set BASECAMP_ACCESS_TOKEN "${response.access_token}"`);
                    console.log('\n🚀 Then redeploy your site for the changes to take effect.\n');
                } else {
                    console.error('\n❌ Error: No access token in response');
                    console.error('Response:', data);
                }
            } catch (error) {
                console.error('\n❌ Error parsing response:', error.message);
                console.error('Response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('\n❌ Request error:', error.message);
    });

    req.write(postData);
    req.end();
}

// Main
const code = process.argv[2];

if (!code) {
    getAuthUrl();
} else {
    console.log('\n🔄 Exchanging authorization code for access token...');
    exchangeToken(code);
}
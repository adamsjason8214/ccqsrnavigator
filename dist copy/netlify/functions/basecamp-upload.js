const https = require('https');
const { URL } = require('url');

// Basecamp configuration
const BASECAMP_ACCOUNT_ID = process.env.BASECAMP_ACCOUNT_ID || '6023243';
const BASECAMP_PROJECT_ID = process.env.BASECAMP_PROJECT_ID || '43545521';
const BASECAMP_VAULT_ID = process.env.BASECAMP_VAULT_ID || '8971236791';
const BASECAMP_ACCESS_TOKEN = process.env.BASECAMP_ACCESS_TOKEN; // Server-side access token

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { 
      pdfBase64, 
      fileName, 
      checklistType, 
      storeLocation,
      managerName,
      date,
      vaultId // Accept vault ID from request
    } = JSON.parse(event.body);

    // Use server-side access token
    const accessToken = BASECAMP_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('No BASECAMP_ACCESS_TOKEN environment variable set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Basecamp integration not configured on server' })
      };
    }

    if (!pdfBase64 || !fileName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Step 1: Create an attachment (upload the file)
    console.log('Uploading PDF to Basecamp...');
    const attachment = await uploadAttachment(accessToken, pdfBuffer, fileName);
    
    if (!attachment || !attachment.attachable_sgid) {
      console.error('Attachment upload failed:', attachment);
      throw new Error('Failed to upload attachment - no sgid received');
    }
    
    console.log('Attachment uploaded successfully, sgid:', attachment.attachable_sgid);

    // Step 2: Create a document in the vault with the attachment
    console.log('Creating document in vault...');
    const documentTitle = `${checklistType} Checklist - ${storeLocation} - ${date}`;
    const documentContent = `
      <div>
        <h2>${checklistType} Checklist</h2>
        <p><strong>Store:</strong> ${storeLocation}</p>
        <p><strong>Manager:</strong> ${managerName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Submitted via:</strong> CCQSR Navigator</p>
        <p><strong>PDF Report:</strong> See attached file</p>
      </div>
    `;

    // Use the vault ID from the request, or fall back to default
    const targetVaultId = vaultId || BASECAMP_VAULT_ID;
    console.log('Using vault ID:', targetVaultId);
    
    const document = await createVaultDocument(
      accessToken,
      documentTitle,
      documentContent,
      attachment.attachable_sgid,
      targetVaultId
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Checklist uploaded to Basecamp successfully',
        documentUrl: document.app_url,
        attachmentUrl: attachment.app_url
      })
    };

  } catch (error) {
    console.error('Basecamp upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Upload failed',
        details: error.message 
      })
    };
  }
};

// Upload attachment to Basecamp
function uploadAttachment(accessToken, fileBuffer, fileName) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Build multipart form data
    const formData = [];
    formData.push(`--${boundary}`);
    formData.push('Content-Disposition: form-data; name="name"');
    formData.push('');
    formData.push(fileName);
    formData.push(`--${boundary}`);
    formData.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"`);
    formData.push('Content-Type: application/pdf');
    formData.push('');
    
    const preData = Buffer.from(formData.join('\r\n') + '\r\n', 'utf8');
    const postData = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    
    const options = {
      hostname: '3.basecampapi.com',
      port: 443,
      path: `/${BASECAMP_ACCOUNT_ID}/attachments.json`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': preData.length + fileBuffer.length + postData.length,
        'User-Agent': 'CCQSR Navigator'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          try {
            const attachment = JSON.parse(data);
            console.log('Attachment response:', JSON.stringify(attachment, null, 2));
            resolve(attachment);
          } catch (e) {
            console.error('Failed to parse attachment:', data);
            reject(new Error('Failed to parse attachment response: ' + e.message));
          }
        } else {
          console.error('Attachment upload failed with status:', res.statusCode);
          console.error('Response:', data);
          reject(new Error(`Attachment upload failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    
    // Write multipart data
    req.write(preData);
    req.write(fileBuffer);
    req.write(postData);
    req.end();
  });
}

// Create a document in the vault
function createVaultDocument(accessToken, title, content, attachmentSgid, vaultId) {
  return new Promise((resolve, reject) => {
    // Create document with attachment embedded in content
    const enrichedContent = `
      ${content}
      <br><br>
      <bc-attachment sgid="${attachmentSgid}"></bc-attachment>
    `;
    
    const postData = JSON.stringify({
      title: title,
      content: enrichedContent,
      status: 'active'  // Ensure it's not a draft
    });

    // Use the provided vault ID or fall back to default
    const targetVaultId = vaultId || BASECAMP_VAULT_ID;
    console.log('Creating document in vault:', targetVaultId);

    const options = {
      hostname: '3.basecampapi.com',
      port: 443,
      path: `/${BASECAMP_ACCOUNT_ID}/buckets/${BASECAMP_PROJECT_ID}/vaults/${targetVaultId}/documents.json`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'CCQSR Navigator'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          try {
            const document = JSON.parse(data);
            console.log('Document created:', document);
            resolve(document);
          } catch (e) {
            reject(new Error('Failed to parse document response: ' + e.message));
          }
        } else {
          reject(new Error(`Document creation failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
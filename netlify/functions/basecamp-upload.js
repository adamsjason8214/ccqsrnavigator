const https = require('https');

// Latest access token  
const ACCESS_TOKEN = 'BAhbB0kiAbB7ImNsaWVudF9pZCI6IjEwYmQ2MjVmODEwNzJjMWMxYTMwOTQ3MWJjMTFhZDAyMmIxZmM3N2UiLCJleHBpcmVzX2F0IjoiMjAyNS0wOS0wM1QwMDo0NToyMFoiLCJ1c2VyX2lkcyI6WzUxNjI0NTY5XSwidmVyc2lvbiI6MSwiYXBpX2RlYWRib2x0IjoiZmEwOTg2OWYxOWI2NGUyOTk3ZTE1NTVjZjI0Y2ZlZmIifQY6BkVUSXU6CVRpbWUNYGAfwB0bT7UJOg1uYW5vX251bWkCIQE6DW5hbm9fZGVuaQY6DXN1Ym1pY3JvIgcokDoJem9uZUkiCFVUQwY7AEY=--3cd52c8834107446b3ec15a761543e8f0a18fc55';

// Basecamp account and project IDs
const ACCOUNT_ID = '6023243';
const PROJECT_ID = '43545521';
const VAULT_ID = '8971651842'; // Documents & Files vault for schedules

function buildMultipartBody(boundary, filename, pdfBuffer) {
  const parts = [];
  
  // Add name field
  parts.push(`--${boundary}`);
  parts.push('Content-Disposition: form-data; name="name"');
  parts.push('');
  parts.push(filename);
  
  // Add file field
  parts.push(`--${boundary}`);
  parts.push(`Content-Disposition: form-data; name="file"; filename="${filename}"`);
  parts.push('Content-Type: application/pdf');
  parts.push('');
  
  // Combine text parts
  const textPart = Buffer.from(parts.join('\r\n') + '\r\n', 'utf8');
  
  // Add ending boundary
  const endPart = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  
  // Combine all parts
  return Buffer.concat([textPart, pdfBuffer, endPart]);
}

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
    const requestBody = JSON.parse(event.body);
    
    // Extract data from request
    let filename, pdfContent, metadata = {};
    let vaultId = requestBody.vaultId || VAULT_ID; // Use provided vault ID or default
    
    if (requestBody.fileName) {
      filename = requestBody.fileName;
      pdfContent = requestBody.pdfBase64;
      metadata = {
        checklistType: requestBody.checklistType,
        storeLocation: requestBody.storeLocation,
        managerName: requestBody.managerName,
        date: requestBody.date
      };
      // Use the vault ID from the request if provided
      if (requestBody.vaultId) {
        vaultId = requestBody.vaultId;
      }
    } else {
      filename = requestBody.filename;
      pdfContent = requestBody.content;
    }
    
    if (!filename || !pdfContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing filename or content' })
      };
    }

    console.log('=== Starting Basecamp Upload ===');
    console.log('Filename:', filename);
    console.log('Checklist Type:', metadata.checklistType || 'Unknown');
    console.log('Vault ID:', vaultId);
    console.log('PDF size (base64):', pdfContent.length);

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfContent, 'base64');
    console.log('PDF size (binary):', pdfBuffer.length, 'bytes');

    // Step 1: Upload PDF as attachment to Basecamp
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const multipartBody = buildMultipartBody(boundary, filename, pdfBuffer);

    console.log('Multipart body size:', multipartBody.length, 'bytes');
    console.log('Uploading attachment to Basecamp...');

    // Upload the attachment
    const attachmentResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: '3.basecampapi.com',
        path: `/${ACCOUNT_ID}/attachments.json`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'User-Agent': 'CCQSR Navigator (adams.jason8214@gmail.com)',
          'Content-Length': multipartBody.length
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Attachment response status:', res.statusCode);
          console.log('Attachment response headers:', res.headers);
          console.log('Attachment response body:', data);
          
          if (res.statusCode === 201) {
            try {
              const result = JSON.parse(data);
              console.log('Attachment SGID:', result.attachable_sgid);
              resolve(result);
            } catch (e) {
              reject(new Error(`Failed to parse attachment response: ${data}`));
            }
          } else {
            reject(new Error(`Attachment upload failed: ${res.statusCode} - ${data}`));
          }
        });
      });
      
      req.on('error', error => {
        console.error('Request error:', error);
        reject(error);
      });
      
      req.write(multipartBody);
      req.end();
    });

    // Step 2: Create document in vault with the attachment
    const documentTitle = filename.replace('.pdf', '');
    
    // Format time in Eastern timezone
    const easternTime = new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    // Embed the attachment in the content HTML
    const documentContent = `<div>
      <p><strong>Type:</strong> ${metadata.checklistType || 'Schedule'}</p>
      <p><strong>Location:</strong> ${metadata.storeLocation || 'N/A'}</p>
      <p><strong>Manager:</strong> ${metadata.managerName || 'N/A'}</p>
      <p><strong>Date:</strong> ${metadata.date || new Date().toLocaleDateString()}</p>
      <p><strong>Submitted:</strong> ${easternTime} EST</p>
    </div>
    <br><br>
    <bc-attachment sgid="${attachmentResponse.attachable_sgid}" content-type="application/pdf" filename="${filename}"></bc-attachment>`;

    const documentData = JSON.stringify({
      title: documentTitle,
      content: documentContent,
      status: 'active'
    });

    console.log('Creating document in vault with attachment...');
    console.log('Document data:', documentData);

    // Create the document
    const documentResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: '3.basecampapi.com',
        path: `/${ACCOUNT_ID}/buckets/${PROJECT_ID}/vaults/${vaultId}/documents.json`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'CCQSR Navigator (adams.jason8214@gmail.com)',
          'Content-Length': Buffer.byteLength(documentData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Document response status:', res.statusCode);
          console.log('Document response:', data);
          
          if (res.statusCode === 201) {
            try {
              const doc = JSON.parse(data);
              console.log('Document created:', doc.app_url);
              resolve({
                success: true,
                documentUrl: doc.app_url,
                documentId: doc.id
              });
            } catch (e) {
              reject(new Error(`Failed to parse document response: ${data}`));
            }
          } else {
            reject(new Error(`Document creation failed: ${res.statusCode} - ${data}`));
          }
        });
      });
      
      req.on('error', error => {
        console.error('Request error:', error);
        reject(error);
      });
      
      req.write(documentData);
      req.end();
    });

    console.log('=== Basecamp Upload Complete ===');
    
    // Format response time in Eastern timezone
    const responseTime = new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Successfully uploaded to Basecamp',
        documentUrl: documentResponse.documentUrl,
        basecampUrl: documentResponse.documentUrl,
        details: {
          filename: filename,
          ...metadata,
          submittedAt: responseTime + ' EST'
        }
      })
    };
    
  } catch (error) {
    console.error('=== Basecamp Upload Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Upload failed',
        message: error.message 
      })
    };
  }
};
// Simple in-memory storage for PDFs (temporary solution)
const pdfStorage = new Map();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // For POST - store the PDF
  if (event.httpMethod === 'POST') {
    try {
      const { filename, pdfData } = JSON.parse(event.body);
      
      // Store PDF data in memory
      pdfStorage.set(filename, {
        data: pdfData,
        uploadedAt: new Date().toISOString()
      });
      
      // Return the URL where this PDF can be accessed
      const siteUrl = process.env.URL || 'https://ccqsrnav.netlify.app';
      const pdfUrl = `${siteUrl}/.netlify/functions/store-pdf?file=${encodeURIComponent(filename)}`;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          url: pdfUrl,
          filename: filename
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // For GET - serve the PDF
  if (event.httpMethod === 'GET') {
    const filename = event.queryStringParameters?.file;
    
    if (!filename) {
      return {
        statusCode: 404,
        headers,
        body: 'PDF filename not provided'
      };
    }
    
    try {
      // Get PDF from memory storage
      const pdfRecord = pdfStorage.get(filename);
      
      if (!pdfRecord) {
        return {
          statusCode: 404,
          headers,
          body: 'PDF not found'
        };
      }
      
      const pdfData = pdfRecord.data;
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
          'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
        },
        body: pdfData,
        isBase64Encoded: true
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error retrieving PDF' })
      };
    }
  }
  
  return {
    statusCode: 405,
    headers,
    body: 'Method not allowed'
  };
};
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const id = event.queryStringParameters?.id;
  if (!id || !/^TG-[A-Z0-9]+$/.test(id)) {
    return { statusCode: 400, body: 'Invalid or missing order ID' };
  }

  try {
    const store = getStore('consent-pdfs');
    const pdfBuffer = await store.get(id, { type: 'arrayBuffer' });

    if (!pdfBuffer) {
      return { statusCode: 404, body: 'Consent PDF not found' };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="consent-${id}.pdf"`
      },
      body: Buffer.from(pdfBuffer).toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('Get consent PDF error:', err.message);
    return { statusCode: 500, body: 'Error retrieving consent PDF' };
  }
};

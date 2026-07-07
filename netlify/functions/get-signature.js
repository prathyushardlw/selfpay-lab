const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const orderId = event.queryStringParameters?.id;
  if (!orderId) {
    return { statusCode: 400, body: 'Missing id parameter' };
  }

  try {
    const store = getStore('signatures');
    const data = await store.get(orderId);

    if (!data) {
      return { statusCode: 404, body: 'Signature not found' };
    }

    // data is stored as base64 PNG (without the data:image/png;base64, prefix)
    const imageBuffer = Buffer.from(data, 'base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('Get signature error:', err.message);
    return { statusCode: 500, body: 'Error retrieving signature' };
  }
};

const { assertAdminAccess } = require('./admin-auth');
const { saveTestCatalog } = require('./test-catalog');

exports.handler = async (event) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    assertAdminAccess(event);

    const payload = JSON.parse(event.body || '{}');
    const tests = await saveTestCatalog(payload.tests);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tests)
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
function getBearerToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function assertAdminAccess(event) {
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  const bearerToken = getBearerToken(event);

  if (!adminToken || bearerToken !== adminToken) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
}

module.exports = {
  assertAdminAccess
};
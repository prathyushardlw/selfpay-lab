const stripe = require('./stripe-client');
const { assertAdminAccess } = require('./admin-auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    assertAdminAccess(event);

    // Try checkout sessions first
    const sessions = await stripe.checkout.sessions.list({
      limit: 50,
      expand: ['data.payment_intent']
    });

    const sessionPayments = sessions.data
      .filter((session) => session.mode === 'payment')
      .map((session) => ({
        orderId: session.metadata?.orderId || 'N/A',
        customerName: session.customer_details?.name || null,
        sessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null,
        checkoutStatus: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email || session.customer_email || null,
        created: session.created
      }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionPayments)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
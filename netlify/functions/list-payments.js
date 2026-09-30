const stripe = require('./stripe-client');
const { assertAdminAccess } = require('./admin-auth');

const PORTAL_SOURCE = 'selfpay-lab';
const DEFAULT_PAYMENT_LIMIT = 50;
const MAX_PAYMENT_LIMIT = 100;
const STRIPE_PAGE_LIMIT = 100;
const MAX_STRIPE_PAGES_PER_REQUEST = 3;

function getPaymentLimit(value) {
  const parsedLimit = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_PAYMENT_LIMIT;
  }

  return Math.min(parsedLimit, MAX_PAYMENT_LIMIT);
}

function isPortalPaymentSession(session) {
  const orderId = String(session.metadata?.orderId || '');

  return (
    session.mode === 'payment' &&
    (session.metadata?.source === PORTAL_SOURCE || orderId.startsWith('TG-'))
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    assertAdminAccess(event);

    const paymentLimit = getPaymentLimit(event.queryStringParameters?.limit);
    const portalSessions = [];
    let startingAfter = event.queryStringParameters?.starting_after || undefined;
    let stripeHasMore = false;
    let lastScannedSessionId = null;
    let scannedPageCount = 0;

    while (portalSessions.length < paymentLimit && scannedPageCount < MAX_STRIPE_PAGES_PER_REQUEST) {
      const sessions = await stripe.checkout.sessions.list({
        limit: STRIPE_PAGE_LIMIT,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        expand: ['data.payment_intent']
      });

      scannedPageCount += 1;
      stripeHasMore = sessions.has_more;
      lastScannedSessionId = sessions.data[sessions.data.length - 1]?.id || lastScannedSessionId;

      portalSessions.push(
        ...sessions.data.filter(
          (session) => isPortalPaymentSession(session)
        )
      );

      if (!sessions.has_more || sessions.data.length === 0) {
        break;
      }

      startingAfter = lastScannedSessionId;
    }

    const sessionPayments = portalSessions
      .slice(0, paymentLimit)
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

    const lastPayment = sessionPayments[sessionPayments.length - 1];
    const hasUnreturnedPortalPayments = portalSessions.length > paymentLimit;
    const canContinueScanning = Boolean(stripeHasMore && lastScannedSessionId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: sessionPayments,
        hasMore: hasUnreturnedPortalPayments || canContinueScanning,
        nextCursor: hasUnreturnedPortalPayments
          ? lastPayment?.sessionId || null
          : lastScannedSessionId
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
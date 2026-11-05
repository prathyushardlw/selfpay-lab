const stripe = require('./stripe-client');
const { getTestsByName, calculateTotal } = require('./test-catalog');
const { setBlobValue } = require('./blob-store');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { testNames, orderId, email, orderData } = JSON.parse(event.body || '{}');

    if (!orderId || !email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required checkout fields.' })
      };
    }

    if (
      !orderData ||
      typeof orderData !== 'object' ||
      orderData.orderId !== orderId ||
      orderData.email !== email
    ) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Complete order details are required before checkout.' })
      };
    }

    const tests = await getTestsByName(testNames);
    const total = await calculateTotal(testNames);
    await setBlobValue('orders', orderId, JSON.stringify({
      ...orderData,
      orderId,
      email,
      tests,
      total,
      status: 'pending',
      savedAt: new Date().toISOString()
    }));

    const lineItems = tests.map(test => ({
      price_data: {
        currency: 'usd',
        product_data: { name: test.name },
        unit_amount: Math.round(test.price * 100)
      },
      quantity: 1
    }));

    const forwardedProto = event.headers['x-forwarded-proto'] || 'https';
    const forwardedHost = event.headers['x-forwarded-host'] || event.headers.host;
    const siteUrl = process.env.URL || `${forwardedProto}://${forwardedHost}`;

    const facilityId = process.env.FACILITY_ID || 'selfpay-lab';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: {
        orderId,
        expectedAmount: String(Math.round(total * 100)),
        source: 'selfpay-lab',
        facilityId
      },
      payment_intent_data: {
        metadata: {
          orderId,
          facilityId
        }
      },
      success_url: `${siteUrl}/success.html?order_id=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/index.html`
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

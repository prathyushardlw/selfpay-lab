const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { tests, total, orderId, email } = JSON.parse(event.body);

    const lineItems = tests.map(test => ({
      price_data: {
        currency: 'usd',
        product_data: { name: test.name },
        unit_amount: Math.round(test.price * 100)
      },
      quantity: 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: { orderId },
      success_url: `${event.headers.origin}/success.html?order_id=${orderId}`,
      cancel_url: `${event.headers.origin}/index.html`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

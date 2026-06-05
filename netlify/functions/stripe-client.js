const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
	throw new Error(
		'Missing STRIPE_SECRET_KEY. For local Netlify dev, either run "netlify link" so CLI can pull site env vars, or create a local .env file with STRIPE_SECRET_KEY and ADMIN_ACCESS_TOKEN.'
	);
}

const stripe = require('stripe')(stripeSecretKey);

module.exports = stripe;
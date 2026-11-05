const { getStore } = require('@netlify/blobs');
const { assertAdminAccess } = require('./admin-auth');
let generateConsentPdf;
try {
  ({ generateConsentPdf } = require('./consent-pdf'));
} catch (e) {
  console.error('consent-pdf module failed to load:', e.message);
}

const ATLANTA_EMAIL = process.env.LAB_NOTIFICATION_EMAIL || 'AtlantaGA@TestGO.com';
const SUBHASH_EMAIL = process.env.ORDER_CC_EMAIL || 'Subhash@TestGO.com';
const DATA_ENTRY_EMAIL = process.env.DATA_ENTRY_EMAIL || 'de@testgo.com';
const BILLING_EMAIL = process.env.BILLING_EMAIL || 'billing@testgo.com';

function getConfig() {
  return {
    fromEmail: process.env.LABSQUIRE_FROM_EMAIL || 'noreply@labsquire.com',
    apiUrl: process.env.KAKA_EMAIL_SERVICE_API_URL,
    apiKey: process.env.KAKA_EMAIL_SERVICE_KEY
  };
}

async function sendEmail(to, subject, html, { cc, bcc } = {}) {
  const { apiKey, apiUrl, fromEmail } = getConfig();
  if (!apiKey) throw new Error('KAKA_EMAIL_SERVICE_KEY not configured.');
  if (!apiUrl) throw new Error('KAKA_EMAIL_SERVICE_API_URL not configured.');

  const response = await fetch(`${apiUrl}/notifications/sendEmail`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        body: { html: { charset: 'UTF-8', data: html } },
        subject: { charset: 'UTF-8', data: subject }
      },
      toAddresses: Array.isArray(to) ? to : [to],
      ...(cc ? { ccAddresses: Array.isArray(cc) ? cc : [cc] } : {}),
      ...(bcc ? { bccAddresses: Array.isArray(bcc) ? bcc : [bcc] } : {}),
      fromEmail
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email API error (${response.status}): ${text}`);
  }
}

// Simplified email builders for retry (reuse same structure as send-order-email)
function buildRetryEmailHtml(body, signatureUrl, consentPdfUrl, variant) {
  const { firstName, lastName, email, phone, dob, gender, address, city, state, zipcode, insurance, race, ethnicity, providerName, providerNPI, providerEmail, providerPhone, tests, total, orderId, submittedAt, consentAcceptedAt } = body;
  const testRows = tests.map(t => {
    const priceCol = variant !== 'dataEntry' ? `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">$${Number(t.price).toFixed(2)}</td>` : '';
    return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${t.name}</td>${priceCol}</tr>`;
  }).join('');
  const fullAddress = [address, city, state, zipcode].filter(Boolean).join(', ');

  let providerHtml = '';
  if (variant !== 'patient' && (providerName || providerNPI || providerEmail || providerPhone)) {
    providerHtml = `<h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Provider Information</h2>
      <table style="width:100%;font-size:14px;color:#333;">
        ${providerName ? `<tr><td style="padding:4px 0;font-weight:600;width:120px;">Provider:</td><td>${providerName}</td></tr>` : ''}
        ${providerNPI ? `<tr><td style="padding:4px 0;font-weight:600;">NPI:</td><td>${providerNPI}</td></tr>` : ''}
        ${providerEmail ? `<tr><td style="padding:4px 0;font-weight:600;">Email:</td><td>${providerEmail}</td></tr>` : ''}
        ${providerPhone ? `<tr><td style="padding:4px 0;font-weight:600;">Phone:</td><td>${providerPhone}</td></tr>` : ''}
      </table>`;
  }

  const detailedPatient = variant !== 'patient';
  const signatureHtml = signatureUrl
    ? `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;text-align:center;"><img src="${signatureUrl}" alt="Participant Signature" style="max-width:300px;height:auto;" /></div>`
    : '<p style="font-size:13px;color:#666;">Signature not available</p>';
  const consentLink = consentPdfUrl ? `<p style="margin-top:10px;text-align:center;"><a href="${consentPdfUrl}" style="font-size:13px;color:#064e3b;font-weight:600;">View Signed Consent (PDF)</a></p>` : '';

  const patientConsentBlock = variant === 'patient' && consentPdfUrl ? `
    <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Consent Agreement</h2>
    <p style="font-size:13px;color:#333;">You accepted the Participation Agreement & Liability Waiver on ${consentAcceptedAt ? new Date(consentAcceptedAt).toLocaleString('en-US', { timeZone: 'America/New_York' }) : submittedAt}.</p>
    <a href="${consentPdfUrl}" style="display:inline-block;margin-top:8px;padding:8px 16px;background:#064e3b;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">View Signed Consent (PDF)</a>` : '';

  return `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#064e3b;padding:16px 24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">TestGO - Self Pay Lab Registration</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
        <p style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;color:#065f46;background:#d1fae5;">Paid Online (Stripe)</p>
        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Patient Details</h2>
        <table style="width:100%;font-size:14px;color:#333;">
          <tr><td style="padding:4px 0;font-weight:600;width:120px;">Name:</td><td>${firstName} ${lastName}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Email:</td><td>${email}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Phone:</td><td>${phone}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">DOB:</td><td>${dob}</td></tr>
          ${detailedPatient ? `<tr><td style="padding:4px 0;font-weight:600;">Gender:</td><td>${gender || 'N/A'}</td></tr>` : ''}
          ${detailedPatient ? `<tr><td style="padding:4px 0;font-weight:600;">Address:</td><td>${fullAddress || 'N/A'}</td></tr>` : ''}
          ${detailedPatient ? `<tr><td style="padding:4px 0;font-weight:600;">Payment:</td><td>${insurance || 'Self Pay'}</td></tr>` : ''}
          ${detailedPatient && race ? `<tr><td style="padding:4px 0;font-weight:600;">Race:</td><td>${race}</td></tr>` : ''}
          ${detailedPatient && ethnicity ? `<tr><td style="padding:4px 0;font-weight:600;">Ethnicity:</td><td>${ethnicity}</td></tr>` : ''}
          <tr><td style="padding:4px 0;font-weight:600;">Order ID:</td><td>${orderId}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Date:</td><td>${submittedAt}</td></tr>
        </table>
        ${providerHtml}
        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Tests Ordered</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;">Test</th>${variant !== 'dataEntry' ? '<th style="padding:8px 12px;text-align:right;">Price</th>' : ''}</tr></thead>
          <tbody>${testRows}</tbody>
          ${variant !== 'dataEntry' ? `<tfoot><tr style="background:#f8fafc;"><td style="padding:10px 12px;font-weight:700;">Total</td><td style="padding:10px 12px;text-align:right;font-weight:700;">$${Number(total).toFixed(2)}</td></tr></tfoot>` : ''}
        </table>
        ${variant === 'patient' ? `<h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Signature</h2>${signatureHtml}${patientConsentBlock}` : ''}
        ${variant !== 'patient' ? `<h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Participant Acknowledgment</h2>${signatureHtml}<p style="font-size:12px;color:#666;margin-top:6px;text-align:center;">Signed on ${submittedAt}</p>${consentLink}` : ''}
        <p style="margin-top:20px;padding:12px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1d4ed8;text-align:center;">&#128424; Please print this email and bring it with you to the fair as your confirmation.</p>
        <p style="margin-top:16px;font-size:12px;color:#666;text-align:center;">For any questions, email <a href="mailto:AtlantaGA@TestGO.com" style="color:#064e3b;">AtlantaGA@TestGO.com</a>.</p>
      </div>
    </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    assertAdminAccess(event);

    const { orderId } = JSON.parse(event.body || '{}');
    if (!orderId) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'orderId is required.' }) };
    }

    const orderStore = getStore('orders');
    const raw = await orderStore.get(orderId, { type: 'text' });
    if (!raw) {
      return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `No saved order data found for ${orderId}.` }) };
    }

    const body = JSON.parse(raw);
    const { firstName, lastName, email } = body;
    const siteUrl = process.env.URL || 'https://selfpayportal.netlify.app';

    // Rebuild signature URL
    const signatureUrl = `${siteUrl}/.netlify/functions/get-signature?id=${encodeURIComponent(orderId)}`;

    // Ensure consent PDF exists, generate if missing
    let consentPdfUrl = '';
    try {
      const consentStore = getStore('consent-pdfs');
      const existing = await consentStore.get(orderId, { type: 'arrayBuffer' });
      if (existing) {
        consentPdfUrl = `${siteUrl}/.netlify/functions/get-consent-pdf?id=${encodeURIComponent(orderId)}`;
      } else if (body.signature && generateConsentPdf) {
        const pdfBuffer = await generateConsentPdf({
          firstName, lastName, dob: body.dob, email,
          consentVersion: body.consentVersion || 'default',
          consentAcceptedAt: body.consentAcceptedAt,
          signature: body.signature
        });
        await consentStore.set(orderId, pdfBuffer);
        consentPdfUrl = `${siteUrl}/.netlify/functions/get-consent-pdf?id=${encodeURIComponent(orderId)}`;
      }
    } catch (pdfErr) {
      console.error('Consent PDF error on retry:', pdfErr.message);
    }

    const facilityName = process.env.FACILITY_NAME || (process.env.FACILITY_ID === 'gapi' ? 'Gapi Self Pay' : 'Self Pay');
    const subject = `${facilityName} - Payment Confirmed - Order ${orderId} - ${firstName} ${lastName}`;

    await Promise.all([
      sendEmail(email, `(Patient Copy) ${subject}`, buildRetryEmailHtml(body, signatureUrl, consentPdfUrl, 'patient'), { cc: ATLANTA_EMAIL, bcc: SUBHASH_EMAIL }),
      sendEmail(ATLANTA_EMAIL, `(Lab Copy) ${subject}`, buildRetryEmailHtml(body, signatureUrl, consentPdfUrl, 'lab'), { cc: SUBHASH_EMAIL }),
      sendEmail(DATA_ENTRY_EMAIL, `(Data Entry Copy) ${subject}`, buildRetryEmailHtml(body, signatureUrl, consentPdfUrl, 'dataEntry'), { cc: [BILLING_EMAIL, ATLANTA_EMAIL, SUBHASH_EMAIL] })
    ]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, orderId })
    };
  } catch (err) {
    const status = err.statusCode || 500;
    return {
      statusCode: status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

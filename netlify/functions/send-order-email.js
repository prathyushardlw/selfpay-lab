const { getBlobValue, setBlobValue } = require('./blob-store');
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

  if (!apiKey) {
    throw new Error('KAKA_EMAIL_SERVICE_KEY is not configured. Set it in Netlify environment variables.');
  }
  if (!apiUrl) {
    throw new Error('KAKA_EMAIL_SERVICE_API_URL is not configured. Set it in Netlify environment variables.');
  }

  console.log('Sending email to:', to, cc ? `cc: ${cc}` : '', bcc ? `bcc: ${bcc}` : '');
  const payload = JSON.stringify({
      message: {
        body: {
          html: {
            charset: 'UTF-8',
            data: html
          }
        },
        subject: {
          charset: 'UTF-8',
          data: subject
        }
      },
      toAddresses: Array.isArray(to) ? to : [to],
      ...(cc ? { ccAddresses: Array.isArray(cc) ? cc : [cc] } : {}),
      ...(bcc ? { bccAddresses: Array.isArray(bcc) ? bcc : [bcc] } : {}),
      fromEmail: fromEmail
    });

  const response = await fetch(`${apiUrl}/notifications/sendEmail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: payload
  });

  const responseText = await response.text();
  console.log(`Kaka API response: status=${response.status}, body=${responseText.substring(0, 200)}`);

  if (!response.ok) {
    throw new Error(`Kaka email API error (${response.status}): ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { ok: true };
  }
}

function buildOrderEmailHtml({ firstName, lastName, email, phone, dob, tests, total, orderId, paymentType, submittedAt, signatureUrl, consentPdfUrl, consentAcceptedAt }) {
  const testRows = tests.map(t => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${t.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">$${Number(t.price).toFixed(2)}</td></tr>`).join('');

  const statusLabel = 'Paid Online (Stripe)';
  const statusColor = '#065f46';
  const statusBg = '#d1fae5';

  const signatureHtml = signatureUrl ? `
        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Signature</h2>
        <img src="${signatureUrl}" alt="Patient Signature" style="max-width:300px;height:auto;border:1px solid #e2e8f0;border-radius:8px;" />` : '';

  const consentHtml = consentPdfUrl ? `
        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Consent Agreement</h2>
        <p style="font-size:13px;color:#333;">You accepted the Participation Agreement & Liability Waiver on ${consentAcceptedAt ? new Date(consentAcceptedAt).toLocaleString('en-US', { timeZone: 'America/New_York' }) : submittedAt}.</p>
        <a href="${consentPdfUrl}" style="display:inline-block;margin-top:8px;padding:8px 16px;background:#064e3b;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">View Signed Consent (PDF)</a>` : '';

  return `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#064e3b;padding:16px 24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">TestGO - Self Pay Lab Registration</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
        <p style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;color:${statusColor};background:${statusBg};">${statusLabel}</p>

        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Patient Details</h2>
        <table style="width:100%;font-size:14px;color:#333;">
          <tr><td style="padding:4px 0;font-weight:600;width:120px;">Name:</td><td>${firstName} ${lastName}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Email:</td><td>${email}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Phone:</td><td>${phone}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">DOB:</td><td>${dob}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Order ID:</td><td>${orderId}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Date:</td><td>${submittedAt}</td></tr>
        </table>

        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Tests Ordered</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;">Test</th><th style="padding:8px 12px;text-align:right;">Price</th></tr></thead>
          <tbody>${testRows}</tbody>
          <tfoot><tr style="background:#f8fafc;"><td style="padding:10px 12px;font-weight:700;">Total</td><td style="padding:10px 12px;text-align:right;font-weight:700;">$${Number(total).toFixed(2)}</td></tr></tfoot>
        </table>

        ${signatureHtml}
        ${consentHtml}
      </div>
    </div>
  `;
}

function buildLabEmailHtml({ firstName, lastName, email, phone, dob, gender, address, city, state, zipcode, insurance, race, ethnicity, providerName, providerNPI, providerEmail, providerPhone, tests, total, orderId, paymentType, submittedAt, signatureUrl, consentPdfUrl, consentAcceptedAt }) {
  const testRows = tests.map(t => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${t.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">$${Number(t.price).toFixed(2)}</td></tr>`).join('');

  const statusLabel = 'Paid Online (Stripe)';
  const statusColor = '#065f46';
  const statusBg = '#d1fae5';

  const fullAddress = [address, city, state, zipcode].filter(Boolean).join(', ');

  let providerHtml = '';
  if (providerName || providerNPI || providerEmail || providerPhone) {
    providerHtml = `
        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Provider Information</h2>
        <table style="width:100%;font-size:14px;color:#333;">
          ${providerName ? `<tr><td style="padding:4px 0;font-weight:600;width:120px;">Provider:</td><td>${providerName}</td></tr>` : ''}
          ${providerNPI ? `<tr><td style="padding:4px 0;font-weight:600;">NPI:</td><td>${providerNPI}</td></tr>` : ''}
          ${providerEmail ? `<tr><td style="padding:4px 0;font-weight:600;">Email:</td><td>${providerEmail}</td></tr>` : ''}
          ${providerPhone ? `<tr><td style="padding:4px 0;font-weight:600;">Phone:</td><td>${providerPhone}</td></tr>` : ''}
        </table>`;
  }

  return `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#064e3b;padding:16px 24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">TestGO - Self Pay Lab Registration</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
        <p style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;color:${statusColor};background:${statusBg};">${statusLabel}</p>

        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Patient Details</h2>
        <table style="width:100%;font-size:14px;color:#333;">
          <tr><td style="padding:4px 0;font-weight:600;width:120px;">Name:</td><td>${firstName} ${lastName}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Email:</td><td>${email}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Phone:</td><td>${phone}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">DOB:</td><td>${dob}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Gender:</td><td>${gender || 'N/A'}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Address:</td><td>${fullAddress || 'N/A'}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Payment:</td><td>${insurance || 'Self Pay'}</td></tr>
          ${race ? `<tr><td style="padding:4px 0;font-weight:600;">Race:</td><td>${race}</td></tr>` : ''}
          ${ethnicity ? `<tr><td style="padding:4px 0;font-weight:600;">Ethnicity:</td><td>${ethnicity}</td></tr>` : ''}
          <tr><td style="padding:4px 0;font-weight:600;">Order ID:</td><td>${orderId}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Date:</td><td>${submittedAt}</td></tr>
        </table>

        ${providerHtml}

        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Tests Ordered</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;">Test</th><th style="padding:8px 12px;text-align:right;">Price</th></tr></thead>
          <tbody>${testRows}</tbody>
          <tfoot><tr style="background:#f8fafc;"><td style="padding:10px 12px;font-weight:700;">Total</td><td style="padding:10px 12px;text-align:right;font-weight:700;">$${Number(total).toFixed(2)}</td></tr></tfoot>
        </table>

        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Participant Acknowledgment</h2>
        ${signatureUrl ? `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;text-align:center;"><img src="${signatureUrl}" alt="Participant Signature" style="max-width:300px;height:auto;display:inline-block;" /></div>` : '<p style="font-size:13px;color:#666;">Signature not available</p>'}
        <p style="font-size:12px;color:#666;margin-top:6px;text-align:center;">Signed on ${submittedAt}</p>
        ${consentPdfUrl ? `<p style="margin-top:10px;text-align:center;"><a href="${consentPdfUrl}" style="font-size:13px;color:#064e3b;font-weight:600;">View Signed Consent (PDF)</a></p>` : ''}

        <p style="margin-top:20px;padding:12px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1d4ed8;text-align:center;">&#128424; Please print this email and bring it with you to the fair as your confirmation.</p>

        <p style="margin-top:16px;font-size:12px;color:#666;text-align:center;">For any questions or concerns, please email us at <a href="mailto:AtlantaGA@TestGO.com" style="color:#064e3b;">AtlantaGA@TestGO.com</a>.</p>
      </div>
    </div>
  `;
}

function buildDataEntryEmailHtml({ firstName, lastName, email, phone, dob, gender, address, city, state, zipcode, insurance, race, ethnicity, providerName, providerNPI, providerEmail, providerPhone, tests, orderId, submittedAt, signatureUrl, consentPdfUrl, consentAcceptedAt }) {
  const testRows = tests.map(t => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${t.name}</td></tr>`).join('');

  const fullAddress = [address, city, state, zipcode].filter(Boolean).join(', ');

  let providerHtml = '';
  if (providerName || providerNPI || providerEmail || providerPhone) {
    providerHtml = `
        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Provider Information</h2>
        <table style="width:100%;font-size:14px;color:#333;">
          ${providerName ? `<tr><td style="padding:4px 0;font-weight:600;width:120px;">Provider:</td><td>${providerName}</td></tr>` : ''}
          ${providerNPI ? `<tr><td style="padding:4px 0;font-weight:600;">NPI:</td><td>${providerNPI}</td></tr>` : ''}
          ${providerEmail ? `<tr><td style="padding:4px 0;font-weight:600;">Email:</td><td>${providerEmail}</td></tr>` : ''}
          ${providerPhone ? `<tr><td style="padding:4px 0;font-weight:600;">Phone:</td><td>${providerPhone}</td></tr>` : ''}
        </table>`;
  }

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
          <tr><td style="padding:4px 0;font-weight:600;">Gender:</td><td>${gender || 'N/A'}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Address:</td><td>${fullAddress || 'N/A'}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Payment:</td><td>${insurance || 'Self Pay'}</td></tr>
          ${race ? `<tr><td style="padding:4px 0;font-weight:600;">Race:</td><td>${race}</td></tr>` : ''}
          ${ethnicity ? `<tr><td style="padding:4px 0;font-weight:600;">Ethnicity:</td><td>${ethnicity}</td></tr>` : ''}
          <tr><td style="padding:4px 0;font-weight:600;">Order ID:</td><td>${orderId}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Date:</td><td>${submittedAt}</td></tr>
        </table>

        ${providerHtml}

        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Tests Ordered</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;">Test</th></tr></thead>
          <tbody>${testRows}</tbody>
        </table>

        <h2 style="font-size:16px;color:#064e3b;margin:20px 0 10px;">Participant Acknowledgment</h2>
        ${signatureUrl ? `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;text-align:center;"><img src="${signatureUrl}" alt="Participant Signature" style="max-width:300px;height:auto;display:inline-block;" /></div>` : '<p style="font-size:13px;color:#666;">Signature not available</p>'}
        <p style="font-size:12px;color:#666;margin-top:6px;text-align:center;">Signed on ${submittedAt}</p>
        ${consentPdfUrl ? `<p style="margin-top:10px;text-align:center;"><a href="${consentPdfUrl}" style="font-size:13px;color:#064e3b;font-weight:600;">View Signed Consent (PDF)</a></p>` : ''}

        <p style="margin-top:20px;padding:12px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1d4ed8;text-align:center;">&#128424; Please print this email and bring it with you to the fair as your confirmation.</p>

        <p style="margin-top:16px;font-size:12px;color:#666;text-align:center;">For any questions or concerns, please email us at <a href="mailto:AtlantaGA@TestGO.com" style="color:#064e3b;">AtlantaGA@TestGO.com</a>.</p>
      </div>
    </div>
  `;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, tests, orderId } = body;

    if (!email || !orderId || !tests || !tests.length) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields.' })
      };
    }

    // Merge the success-page snapshot into the full order saved before checkout.
    const savedOrderData = await getBlobValue('orders', orderId, { type: 'text' });
    const savedOrder = savedOrderData ? JSON.parse(savedOrderData) : {};
    const completeOrder = {
      ...savedOrder,
      ...body,
      orderId,
      savedAt: new Date().toISOString()
    };
    await setBlobValue('orders', orderId, JSON.stringify(completeOrder));
    console.log('Order data saved to blob storage:', orderId);

    const {
      firstName,
      lastName,
      dob,
      consentAcceptedAt,
      consentVersion
    } = completeOrder;
    const siteUrl = process.env.URL || 'https://selfpayportal.netlify.app';

    // Store signature in Netlify Blobs and get a hosted URL
    let signatureUrl = '';
    if (completeOrder.signature) {
      try {
        const base64Data = completeOrder.signature.replace(/^data:image\/\w+;base64,/, '');
        await setBlobValue('signatures', orderId, base64Data);
        signatureUrl = `${siteUrl}/.netlify/functions/get-signature?id=${encodeURIComponent(orderId)}`;
        console.log('Signature stored, URL:', signatureUrl);
      } catch (sigErr) {
        console.error('Failed to store signature, falling back to inline:', sigErr.message);
        signatureUrl = completeOrder.signature;
      }
    }

    // Generate consent PDF, store in Blobs
    let consentPdfUrl = '';
    try {
      if (!generateConsentPdf) throw new Error('PDF generation not available');
      const pdfBuffer = await generateConsentPdf({
        firstName, lastName, dob, email,
        consentVersion: completeOrder.consentVersion || consentVersion || 'default',
        consentAcceptedAt: completeOrder.consentAcceptedAt || consentAcceptedAt,
        signature: completeOrder.signature
      });
      await setBlobValue('consent-pdfs', orderId, pdfBuffer);
      consentPdfUrl = `${siteUrl}/.netlify/functions/get-consent-pdf?id=${encodeURIComponent(orderId)}`;
      console.log('Consent PDF stored, URL:', consentPdfUrl);
    } catch (pdfErr) {
      console.error('Failed to generate consent PDF:', pdfErr.message);
    }

    const emailData = {
      ...completeOrder,
      signatureUrl,
      consentPdfUrl,
      consentAcceptedAt: completeOrder.consentAcceptedAt || consentAcceptedAt
    };
    const patientHtml = buildOrderEmailHtml(emailData);
    const labHtml = buildLabEmailHtml(emailData);
    const dataEntryHtml = buildDataEntryEmailHtml(emailData);
    const facilityName = process.env.FACILITY_NAME ||
      (process.env.FACILITY_ID === 'gapi' ? 'Gapi Self Pay' : 'Self Pay');
    const subject = `${facilityName} - Payment Confirmed - Order ${orderId} - ${firstName} ${lastName}`;

    // Email 1: Patient copy - To: patient, CC: Atlanta, BCC: Subhash
    const patientEmailPromise = sendEmail(
      email,
      `(Patient Copy) ${subject}`,
      patientHtml,
      { cc: ATLANTA_EMAIL, bcc: SUBHASH_EMAIL }
    );

    // Email 2: Lab copy (with full details) - To: Atlanta, CC: Subhash
    const labEmailPromise = sendEmail(
      ATLANTA_EMAIL,
      `(Lab Copy) ${subject}`,
      labHtml,
      { cc: SUBHASH_EMAIL }
    );

    // Email 3: Data entry copy - To: DE, CC: Billing + Atlanta + Subhash
    const dataEntryEmailPromise = sendEmail(
      DATA_ENTRY_EMAIL,
      `(Data Entry Copy) ${subject}`,
      dataEntryHtml,
      { cc: [BILLING_EMAIL, ATLANTA_EMAIL, SUBHASH_EMAIL] }
    );

    await Promise.all([patientEmailPromise, labEmailPromise, dataEntryEmailPromise]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Email send error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to send email.' })
    };
  }
};

const PDFDocument = require('pdfkit');

const CONSENT_TEXTS = {
  default: {
    title: 'TestGO Health Fair Participation Agreement & Liability Waiver',
    preamble: [
      'Voluntary Lab Screening: You are choosing to receive these heavily discounted laboratory tests voluntarily for your own informational purposes.',
      'Lab Testing Only: TestGO provides lab testing services only. We do not provide clinical medical care, diagnoses, or treatments.',
      'Result Sharing: By signing, you authorize TestGO to send your results directly to you, the event organizers, and your designated or consulting primary care physician/clinic.'
    ],
    terms: [
      { heading: '1. Voluntary Testing & Patient Request', text: 'I understand that participating in this laboratory testing ("Testing") is entirely voluntary and is being performed solely at my request. I acknowledge that these heavily discounted screening tests are for informational and educational purposes only and do not constitute a comprehensive medical exam or a substitute for regular, professional healthcare.' },
      { heading: '2. Interaction with Volunteer Healthcare Professionals', text: 'During the health fair, I may discuss test recommendations or my requested test menu with onsite volunteer healthcare providers. I explicitly agree that these brief interactions do not establish a formal doctor-patient relationship with the volunteers or TestGO. If an onsite provider suggests specific laboratory tests, I agree that it remains my sole responsibility to seek a formal opinion, diagnosis, and follow-up care from my own primary care physician regarding the final results.' },
      { heading: '3. No Medical Advice or Clinical Diagnosis', text: 'I agree that neither TestGO nor the onsite volunteer physicians are providing medical advice, clinical diagnoses, or health assessments based on the Testing. I understand that I should not rely on these raw screening results to self-diagnose or treat any health condition. If I am experiencing serious or urgent symptoms, I agree to seek immediate emergency medical care.' },
      { heading: '4. Indemnification & Release of Liability', text: 'In consideration for receiving the opportunity to participate in this Testing, I hereby release, waive, discharge, and covenant not to sue TestGO, the event organizers, the onsite volunteer physicians, and their respective staff, members, owners, officers, agents, volunteers, and employees ("Indemnitees") from any and all liabilities, claims, demands, injuries (including death), or damages—including court costs and attorney\'s fees—arising out of or related to my participation in Testing, the selection of tests, travel to and from the Testing location, or presence on the premises, to the fullest extent permitted by federal, state, and local regulations.' },
      { heading: '5. HIPAA Release & Information Disclosure', text: 'I hereby waive my rights regarding protected health information (PHI) under HIPAA to the extent necessary to complete the Testing. I authorize TestGO to deliver the results of this Testing to: Myself; The organization arranging this health fair event; My primary care physician, clinic, or the healthcare provider I consulted with at this event; and Local and state public health authorities if required by law. TestGO will not reuse or disclose my PHI to any other person or entity except as legally required.' }
    ],
    acknowledgment: 'By signing below, I acknowledge and represent that I have read this agreement, fully understand it, and sign it voluntarily.'
  },
  gapi: {
    title: 'TestGO Health Fair Participation Agreement & Liability Waiver',
    preamble: [
      'This agreement is between you and Devansh Lab Werks LLC, doing business as TestGO ("TestGO"). Please read it carefully. By signing, you confirm three things:',
      '• Voluntary screening: You are choosing to receive these discounted laboratory tests voluntarily, for your own information.',
      '• Lab testing only: TestGO provides laboratory testing services only. TestGO does not provide medical care, diagnoses, or treatment.',
      '• Result sharing: You authorize TestGO to send your results to you and to the primary care physician or clinic you list on this form.'
    ],
    terms: [
      { heading: '1. Voluntary Testing at My Request', text: 'I understand that this laboratory testing ("Testing") is voluntary and is performed at my request. These discounted screening tests are for informational purposes only. They are not a complete medical exam and do not replace regular care from my own healthcare provider.' },
      { heading: '2. Onsite Volunteer Healthcare Professionals', text: 'At the health fair, I may speak with volunteer healthcare professionals about which tests to request. I agree that these brief conversations do not create a doctor-patient relationship with the volunteers or with TestGO. If a volunteer suggests specific tests, I remain responsible for reviewing my results, and for any diagnosis and follow-up care, with my own primary care physician.' },
      { heading: '3. Specimen Collection by TestGO Phlebotomists', text: 'My specimen will be collected by a TestGO phlebotomist. The phlebotomist\'s role is limited to collecting and labeling my specimen. Phlebotomists do not select tests, provide medical advice, or interpret results, and they are not responsible for my test choices or for decisions about my care. I understand that a blood draw may cause minor bruising, soreness, lightheadedness, or, rarely, fainting or infection, and I accept these risks.' },
      { heading: '4. No Medical Advice or Diagnosis', text: 'Neither TestGO nor the onsite volunteers provide medical advice, diagnoses, or health assessments based on the Testing. I will not rely on these screening results alone to diagnose or treat any health condition. If I have serious or urgent symptoms, I will seek emergency medical care right away or call 911.' },
      { heading: '5. Release of Liability', text: 'In exchange for the opportunity to participate, I release, waive, and discharge TestGO and its phlebotomists, the event organizers, the onsite volunteer healthcare professionals, and their staff, members, owners, officers, agents, volunteers, and employees (the "Released Parties") from any and all claims, demands, damages, and liabilities, including claims for personal injury, court costs, and attorney\'s fees, arising out of or related to my participation in the Testing, my choice of tests, travel to and from the Testing location, or my presence on the premises. I agree not to sue the Released Parties for any claim released by this section. This release applies to the fullest extent permitted by law. It does not apply to claims caused by gross negligence or willful misconduct, or to any right that cannot be waived under applicable law.' },
      { heading: '6. HIPAA Authorization and Release of Results', text: 'I authorize TestGO to release the results of this Testing, and the information needed to identify me, to: Myself; My primary care physician or clinic, as listed on this form; Local and state public health authorities, when required by law.\n\nPurpose: to give me my results and to support follow-up care with my own healthcare provider.\nExpiration: this authorization expires one year from the date I sign, unless I revoke it sooner.\nRight to revoke: I may revoke this authorization at any time by writing to TestGO at the email below. Revoking it does not affect results already released.\nNot a condition of testing: TestGO will not condition my Testing on my signing this authorization.\nRe-disclosure: information released to my physician or clinic may be re-disclosed by them and may no longer be protected by federal privacy law.\n\nTestGO will not use or disclose my health information for any other purpose, except as required or permitted by law. I may request a copy of this signed form.' }
    ],
    acknowledgment: 'By signing below, I confirm that I have read this agreement, I understand it, and I sign it voluntarily. I am 18 or older, or my parent or legal guardian is signing for me.'
  }
};

async function generateConsentPdf({ firstName, lastName, dob, email, consentVersion, consentAcceptedAt, signature }) {
  const version = CONSENT_TEXTS[consentVersion] || CONSENT_TEXTS.default;
  const acceptedDate = consentAcceptedAt ? new Date(consentAcceptedAt).toLocaleString('en-US', { timeZone: 'America/New_York' }) : 'N/A';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.rect(0, 0, doc.page.width, 70).fill('#064e3b');
    doc.fill('#ffffff').fontSize(20).font('Helvetica-Bold')
      .text('TestGO', 50, 22, { align: 'left' });
    doc.fontSize(10).font('Helvetica')
      .text('Health Fair Participation Agreement & Liability Waiver', 50, 46, { align: 'left' });

    doc.fill('#000000');
    let y = 90;

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text(version.title, 50, y, { width: 510 });
    y = doc.y + 12;

    // Preamble
    doc.fontSize(10).font('Helvetica');
    for (const line of version.preamble) {
      doc.text(line, 50, y, { width: 510 });
      y = doc.y + 6;
    }
    y += 6;

    // Terms
    doc.fontSize(12).font('Helvetica-Bold').text('Terms of Participation', 50, y, { width: 510 });
    y = doc.y + 8;

    for (const term of version.terms) {
      if (y > 680) {
        doc.addPage();
        y = 50;
      }
      doc.fontSize(10).font('Helvetica-Bold').text(term.heading, 50, y, { width: 510 });
      y = doc.y + 3;
      doc.fontSize(9).font('Helvetica').text(term.text, 50, y, { width: 510 });
      y = doc.y + 10;
    }

    // Acknowledgment
    if (y > 620) {
      doc.addPage();
      y = 50;
    }
    y += 6;
    doc.fontSize(10).font('Helvetica-Bold').text(version.acknowledgment, 50, y, { width: 510 });
    y = doc.y + 20;

    // Participant Info
    if (y > 600) {
      doc.addPage();
      y = 50;
    }
    doc.moveTo(50, y).lineTo(560, y).stroke('#064e3b');
    y += 12;

    doc.fontSize(12).font('Helvetica-Bold').fill('#064e3b').text('Participant Information', 50, y, { width: 510 });
    y = doc.y + 8;
    doc.fill('#000000').fontSize(10).font('Helvetica');
    doc.text(`Name: ${firstName} ${lastName}`, 50, y, { width: 510 });
    y = doc.y + 4;
    doc.text(`Date of Birth: ${dob}`, 50, y, { width: 510 });
    y = doc.y + 4;
    doc.text(`Email: ${email}`, 50, y, { width: 510 });
    y = doc.y + 4;
    doc.text(`Consent Accepted: ${acceptedDate} (ET)`, 50, y, { width: 510 });
    y = doc.y + 4;
    doc.text(`Consent Version: ${consentVersion || 'default'}`, 50, y, { width: 510 });
    y = doc.y + 16;

    // Signature
    if (signature) {
      if (y > 580) {
        doc.addPage();
        y = 50;
      }
      doc.fontSize(10).font('Helvetica-Bold').text('Participant Signature:', 50, y, { width: 510 });
      y = doc.y + 6;
      try {
        doc.image(signature, 50, y, { width: 250, height: 80 });
        y += 90;
      } catch (e) {
        doc.fontSize(9).font('Helvetica').text('[Signature image unavailable]', 50, y);
        y = doc.y + 6;
      }
    }

    // Footer line
    y += 10;
    doc.moveTo(50, y).lineTo(560, y).stroke('#e2e8f0');
    y += 8;
    doc.fontSize(8).font('Helvetica').fill('#666666')
      .text(`This document was electronically signed on ${acceptedDate} (ET). A copy has been retained by TestGO for records.`, 50, y, { width: 510, align: 'center' });

    doc.end();
  });
}

module.exports = { generateConsentPdf };

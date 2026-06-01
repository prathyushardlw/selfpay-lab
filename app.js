// Lab tests data
const labTests = [
  { name: "Complete Blood Count", price: 5.00, tube: "Lavender" },
  { name: "Comp. Metabolic Panel(14)", price: 6.00, tube: "Green" },
  { name: "Lipid Panel", price: 9.00, tube: "Green" },
  { name: "Vitamin B12", price: 10.00, tube: "Red" },
  { name: "Vitamin D", price: 10.00, tube: "Red" },
  { name: "Hgb A1c", price: 10.00, tube: "Lavender" },
  { name: "Prostate-specific Antigen", price: 20.00, tube: "Red" },
  { name: "Thyroid-stimulating hormone", price: 10.00, tube: "Red" },
  { name: "Urinalysis", price: 5.00, tube: "Yellow (Urine Cup)" },
  { name: "Urine Culture", price: 30.00, tube: "Yellow (Urine Cup)" },
  { name: "Iron Studies", price: 50.00, tube: "Green" },
  { name: "Testosterone", price: 20.00, tube: "Red" },
  { name: "T3+T4+T7+TSH", price: 20.00, tube: "Red" },
  { name: "BNP", price: 35.00, tube: "Lavender" },
  { name: "Sed Rate", price: 10.00, tube: "Lavender" },
  { name: "High Sensitive CRP", price: 20.00, tube: "Red" },
  { name: "Microalbumin/Creat. Ratio", price: 20.00, tube: "Yellow (Urine Cup)" },
  { name: "Folic Acid", price: 15.00, tube: "Red" }
];

// Tube color hex map
const tubeColors = {
  "Lavender": "#9b59b6",
  "Green": "#27ae60",
  "Red": "#e74c3c",
  "Yellow (Urine Cup)": "#f1c40f"
};

// State
const selectedTests = new Set();
let orderData = null;

// Page navigation
function showPage(pageId) {
  document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// Render test list
function renderTests() {
  const container = document.getElementById('testList');
  container.innerHTML = labTests.map((test, index) => `
    <div class="test-item" data-index="${index}" role="checkbox" aria-checked="false" tabindex="0">
      <span class="test-item-name">${test.name} ($${test.price.toFixed(2)})</span>
      <span class="checkbox-circle"></span>
    </div>
  `).join('');

  container.addEventListener('click', (e) => {
    const item = e.target.closest('.test-item');
    if (!item) return;
    toggleTest(item);
  });

  container.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const item = e.target.closest('.test-item');
      if (item) {
        e.preventDefault();
        toggleTest(item);
      }
    }
  });
}

function toggleTest(item) {
  const index = parseInt(item.dataset.index);
  if (selectedTests.has(index)) {
    selectedTests.delete(index);
    item.classList.remove('selected');
    item.setAttribute('aria-checked', 'false');
  } else {
    selectedTests.add(index);
    item.classList.add('selected');
    item.setAttribute('aria-checked', 'true');
  }
  updateTotal();
}

function updateTotal() {
  let total = 0;
  selectedTests.forEach(index => {
    total += labTests[index].price;
  });
  document.getElementById('totalAmount').textContent = `$ ${total.toFixed(2)}`;
}

// Date of Birth formatting (mm-dd-yyyy)
function setupDOBInput() {
  const dob = document.getElementById('dob');
  dob.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length >= 5) {
      val = val.slice(0, 2) + '-' + val.slice(2, 4) + '-' + val.slice(4);
    } else if (val.length >= 3) {
      val = val.slice(0, 2) + '-' + val.slice(2);
    }
    e.target.value = val;
  });
}

// SSN formatting (000-00-0000)
function setupSSNInput() {
  const ssn = document.getElementById('ssn');
  ssn.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.slice(0, 9);
    if (val.length >= 6) {
      val = val.slice(0, 3) + '-' + val.slice(3, 5) + '-' + val.slice(5);
    } else if (val.length >= 4) {
      val = val.slice(0, 3) + '-' + val.slice(3);
    }
    e.target.value = val;
  });
}

// Card number formatting
function setupCardInputs() {
  const cardNumber = document.getElementById('cardNumber');
  cardNumber.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = val;
  });

  const cardExpiry = document.getElementById('cardExpiry');
  cardExpiry.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    e.target.value = val;
  });

  const cardCvv = document.getElementById('cardCvv');
  cardCvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });
}

// Signature Pad
let signatureCanvas, signatureCtx, isDrawing = false, hasSigned = false;

function setupSignaturePad() {
  signatureCanvas = document.getElementById('signatureCanvas');
  signatureCtx = signatureCanvas.getContext('2d');

  function resizeCanvas() {
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCanvas.width = rect.width * window.devicePixelRatio;
    signatureCanvas.height = rect.height * window.devicePixelRatio;
    signatureCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    signatureCtx.strokeStyle = '#333';
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
  }

  resizeCanvas();

  function getPos(e) {
    const rect = signatureCanvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  signatureCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    hasSigned = true;
    const pos = getPos(e);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
  });

  signatureCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
  });

  signatureCanvas.addEventListener('mouseup', () => { isDrawing = false; });
  signatureCanvas.addEventListener('mouseleave', () => { isDrawing = false; });

  signatureCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    hasSigned = true;
    const pos = getPos(e);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
  }, { passive: false });

  signatureCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
  }, { passive: false });

  signatureCanvas.addEventListener('touchend', () => { isDrawing = false; });

  document.getElementById('clearSignature').addEventListener('click', () => {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    hasSigned = false;
  });
}

// Form Validation
function validateForm() {
  let isValid = true;

  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('visible'));
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

  const requiredFields = ['email', 'firstName', 'lastName', 'dob', 'phone', 'address', 'city', 'state', 'zipcode'];
  requiredFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input.value.trim()) {
      input.classList.add('invalid');
      const errorEl = document.querySelector(`.error-msg[data-for="${id}"]`);
      if (errorEl) errorEl.classList.add('visible');
      isValid = false;
    }
  });

  const email = document.getElementById('email');
  if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    email.classList.add('invalid');
    const errorEl = document.querySelector('.error-msg[data-for="email"]');
    if (errorEl) {
      errorEl.textContent = 'Please enter a valid email address';
      errorEl.classList.add('visible');
    }
    isValid = false;
  }

  const genderChecked = document.querySelector('input[name="gender"]:checked');
  if (!genderChecked) {
    const errorEl = document.querySelector('.error-msg[data-for="gender"]');
    if (errorEl) errorEl.classList.add('visible');
    isValid = false;
  }

  ['race', 'ethnicity'].forEach(id => {
    const select = document.getElementById(id);
    if (!select.value) {
      select.classList.add('invalid');
      const errorEl = document.querySelector(`.error-msg[data-for="${id}"]`);
      if (errorEl) errorEl.classList.add('visible');
      isValid = false;
    }
  });

  if (!hasSigned) {
    const errorEl = document.querySelector('.error-msg[data-for="signature"]');
    if (errorEl) errorEl.classList.add('visible');
    isValid = false;
  }

  if (selectedTests.size === 0) {
    alert('Please select at least one test.');
    isValid = false;
  }

  return isValid;
}

// Generate order ID
function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'TG-' + ts + rand;
}

// Show payment page
function showPaymentPage(formData) {
  const summary = document.getElementById('paymentSummary');
  let html = '';
  formData.tests.forEach(t => {
    html += `<div class="summary-line"><span>${t.name}</span><span>$${t.price.toFixed(2)}</span></div>`;
  });
  html += `<div class="summary-total"><span>Total</span><span>$${formData.total.toFixed(2)}</span></div>`;
  summary.innerHTML = html;

  // Pre-fill card name
  document.getElementById('cardName').value = formData.firstName + ' ' + formData.lastName;

  showPage('paymentPage');
}

// Show confirmation page
function showConfirmationPage() {
  const details = document.getElementById('orderDetails');
  let html = '';
  html += `<div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${orderData.orderId}</span></div>`;
  html += `<div class="detail-row"><span class="detail-label">Patient</span><span class="detail-value">${orderData.firstName} ${orderData.lastName}</span></div>`;
  html += `<div class="detail-row"><span class="detail-label">DOB</span><span class="detail-value">${orderData.dob}</span></div>`;
  html += `<div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${orderData.email}</span></div>`;
  html += `<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${orderData.phone}</span></div>`;
  html += `<div class="detail-row"><span class="detail-label">Tests</span><span class="detail-value">${orderData.tests.map(t => t.name).join(', ')}</span></div>`;
  html += `<div class="detail-row"><span class="detail-label">Total Paid</span><span class="detail-value" style="color:#059669;font-weight:700;">$${orderData.total.toFixed(2)}</span></div>`;
  html += `<div class="detail-row"><span class="detail-label">Payment</span><span class="detail-value">**** ${orderData.cardLast4}</span></div>`;
  details.innerHTML = html;

  // Tubes needed
  const tubeSection = document.getElementById('tubeSection');
  const tubesNeeded = {};
  orderData.tests.forEach(t => {
    if (!tubesNeeded[t.tube]) tubesNeeded[t.tube] = [];
    tubesNeeded[t.tube].push(t.name);
  });

  let tubeHtml = '<h3>Tubes Required</h3>';
  Object.keys(tubesNeeded).forEach(tube => {
    const color = tubeColors[tube] || '#999';
    tubeHtml += `<div class="tube-item">
      <span class="tube-color" style="background:${color}"></span>
      <span><strong>${tube}</strong> — ${tubesNeeded[tube].join(', ')}</span>
    </div>`;
  });
  tubeSection.innerHTML = tubeHtml;

  showPage('confirmationPage');
}

// Print label (name + DOB only) for mobile printer
function printLabel() {
  const printWindow = window.open('', '_blank', 'width=400,height=250');
  printWindow.document.write(`
    <html>
    <head><title>Patient Label</title>
    <style>
      body { margin: 0; padding: 16px; font-family: Arial, sans-serif; }
      .label { border: 2px solid #000; padding: 12px 16px; display: inline-block; }
      .label-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
      .label-dob { font-size: 14px; color: #333; }
      .label-id { font-size: 11px; color: #666; margin-top: 4px; }
    </style>
    </head>
    <body>
      <div class="label">
        <div class="label-name">${orderData.lastName}, ${orderData.firstName}</div>
        <div class="label-dob">DOB: ${orderData.dob}</div>
        <div class="label-id">${orderData.orderId}</div>
      </div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Print invoice (tests ordered + total)
function printInvoice() {
  let testsRows = orderData.tests.map(t =>
    `<tr><td>${t.name}</td><td style="text-align:right">$${t.price.toFixed(2)}</td></tr>`
  ).join('');

  const printWindow = window.open('', '_blank', 'width=600,height=700');
  printWindow.document.write(`
    <html>
    <head><title>Invoice - ${orderData.orderId}</title>
    <style>
      body { margin: 0; padding: 24px; font-family: Arial, sans-serif; font-size: 13px; color: #333; }
      h2 { margin: 0 0 4px; font-size: 18px; }
      .subtitle { color: #666; margin-bottom: 16px; font-size: 12px; }
      .info { margin-bottom: 16px; }
      .info p { margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
      th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }
      .total-row td { border-top: 2px solid #333; font-weight: bold; font-size: 14px; }
      .footer { margin-top: 20px; font-size: 11px; color: #888; }
    </style>
    </head>
    <body>
      <h2>TestGO - Self Pay Invoice</h2>
      <div class="subtitle">Order: ${orderData.orderId} | Date: ${orderData.paymentDate}</div>
      <div class="info">
        <p><strong>Patient:</strong> ${orderData.firstName} ${orderData.lastName}</p>
        <p><strong>DOB:</strong> ${orderData.dob}</p>
        <p><strong>Email:</strong> ${orderData.email}</p>
        <p><strong>Phone:</strong> ${orderData.phone}</p>
      </div>
      <table>
        <thead><tr><th>Test</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          ${testsRows}
          <tr class="total-row"><td>Total</td><td style="text-align:right">$${orderData.total.toFixed(2)}</td></tr>
        </tbody>
      </table>
      <p><strong>Payment:</strong> Card ending in ${orderData.cardLast4}</p>
      <div class="footer">Devansh Lab Werks | MicroGen Health — Thank you for choosing TestGO.</div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Form submission
function setupForm() {
  const form = document.getElementById('selfPayForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = document.querySelector('.invalid, .error-msg.visible');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Collect form data
    const formData = {
      tests: Array.from(selectedTests).map(i => labTests[i]),
      email: document.getElementById('email').value.trim(),
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      gender: document.querySelector('input[name="gender"]:checked').value,
      dob: document.getElementById('dob').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      ssn: document.getElementById('ssn').value.trim(),
      race: document.getElementById('race').value,
      ethnicity: document.getElementById('ethnicity').value,
      address: document.getElementById('address').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value.trim(),
      zipcode: document.getElementById('zipcode').value.trim(),
      insurance: document.getElementById('insurance').value,
      signature: signatureCanvas.toDataURL(),
      total: Array.from(selectedTests).reduce((sum, i) => sum + labTests[i].price, 0)
    };

    // Store and go to payment
    orderData = { ...formData, orderId: generateOrderId() };
    showPaymentPage(formData);
  });

  // Cancel button
  document.getElementById('cancelBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      form.reset();
      selectedTests.clear();
      document.querySelectorAll('.test-item.selected').forEach(el => {
        el.classList.remove('selected');
        el.setAttribute('aria-checked', 'false');
      });
      signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
      hasSigned = false;
      updateTotal();
      document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('visible'));
      document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    }
  });
}

// Payment completion
function setupPayment() {
  document.getElementById('completePaymentBtn').addEventListener('click', () => {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    const cardName = document.getElementById('cardName').value.trim();

    if (!cardName || cardNumber.length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
      alert('Please fill in all payment fields correctly.');
      return;
    }

    // Store last 4 digits
    orderData.cardLast4 = cardNumber.slice(-4);
    orderData.paymentDate = new Date().toLocaleString();

    // Show confirmation
    showConfirmationPage();
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Welcome page - Get Started
  document.getElementById('getStartedBtn').addEventListener('click', () => {
    showPage('registrationPage');
  });

  // Print buttons
  document.getElementById('printLabelBtn').addEventListener('click', printLabel);
  document.getElementById('printInvoiceBtn').addEventListener('click', printInvoice);

  renderTests();
  setupDOBInput();
  setupSSNInput();
  setupCardInputs();
  setupSignaturePad();
  setupForm();
  setupPayment();
});

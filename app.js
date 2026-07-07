// Lab tests data
let labTests = [
  { name: "Amylase", price: 5.00, tube: "Green" },
  { name: "Anti-HAV IgM", price: 14.00, tube: "Red" },
  { name: "Anti-Hbc", price: 14.00, tube: "Red" },
  { name: "Anti-Hbc IgM", price: 14.00, tube: "Red" },
  { name: "Anti-HBS", price: 14.00, tube: "Red" },
  { name: "Anti-HCV", price: 14.00, tube: "Red" },
  { name: "Anti-Tg", price: 14.00, tube: "Red" },
  { name: "Anti-TPO", price: 14.00, tube: "Red" },
  { name: "CBC with Automated Diff", price: 3.00, tube: "Lavender" },
  { name: "Comprehensive Metabolic Panel (CMP)", price: 3.00, tube: "Green" },
  { name: "DHEA-S", price: 25.00, tube: "Red" },
  { name: "Digoxin", price: 15.00, tube: "Red" },
  { name: "Direct Bilirubin", price: 5.00, tube: "Green" },
  { name: "Estradiol", price: 25.00, tube: "Red" },
  { name: "Ferritin", price: 12.00, tube: "Red" },
  { name: "Folate", price: 12.00, tube: "Red" },
  { name: "Free PSA", price: 15.00, tube: "Red" },
  { name: "Free T3", price: 5.00, tube: "Red" },
  { name: "Free T4", price: 8.00, tube: "Red" },
  { name: "FSH", price: 15.00, tube: "Red" },
  { name: "GGT", price: 8.00, tube: "Green" },
  { name: "HBsAg", price: 10.00, tube: "Red" },
  { name: "HDL", price: 8.00, tube: "Green" },
  { name: "Hemoglobin A1c (HgbA1c)", price: 6.00, tube: "Lavender" },
  { name: "Hepatic Profile (Liver Function)", price: 15.00, tube: "Green" },
  { name: "Hepatitis Panel", price: 45.00, tube: "Red" },
  { name: "HIV Screening", price: 15.00, tube: "Red" },
  { name: "Insulin", price: 10.00, tube: "Red" },
  { name: "Iron Profile", price: 15.00, tube: "Green" },
  { name: "Lactate", price: 10.00, tube: "Green" },
  { name: "LDH", price: 6.00, tube: "Green" },
  { name: "LDL", price: 12.00, tube: "Green" },
  { name: "LH", price: 15.00, tube: "Red" },
  { name: "Lipase", price: 6.00, tube: "Green" },
  { name: "Lipid Panel", price: 8.00, tube: "Green" },
  { name: "Lithium", price: 6.00, tube: "Red" },
  { name: "Magnesium", price: 6.00, tube: "Green" },
  { name: "Phosphorus", price: 5.00, tube: "Green" },
  { name: "Prealbumin", price: 13.00, tube: "Red" },
  { name: "Prolactin", price: 15.00, tube: "Red" },
  { name: "Renal Panel", price: 8.00, tube: "Green" },
  { name: "Rheumatoid Factor", price: 7.00, tube: "Red" },
  { name: "Rubella IgG", price: 12.00, tube: "Red" },
  { name: "Rubella IgM", price: 12.00, tube: "Red" },
  { name: "SHBG", price: 20.00, tube: "Red" },
  { name: "Syphilis", price: 15.00, tube: "Red" },
  { name: "Testosterone", price: 15.00, tube: "Red" },
  { name: "Total Bilirubin", price: 5.00, tube: "Green" },
  { name: "Total PSA", price: 15.00, tube: "Red" },
  { name: "Total T3", price: 15.00, tube: "Red" },
  { name: "Total T4", price: 7.00, tube: "Red" },
  { name: "Transferrin", price: 12.00, tube: "Red" },
  { name: "TSH", price: 10.00, tube: "Red" },
  { name: "T-Uptake", price: 8.00, tube: "Red" },
  { name: "Uric Acid", price: 8.00, tube: "Green" },
  { name: "Urine Microalbumin", price: 8.00, tube: "Yellow (Urine Cup)" },
  { name: "Urine Analysis", price: 6.00, tube: "Yellow (Urine Cup)" },
  { name: "Valproic Acid", price: 18.00, tube: "Red" },
  { name: "Vancomycin", price: 15.00, tube: "Red" },
  { name: "Vitamin B12", price: 15.00, tube: "Red" },
  { name: "Vitamin D", price: 25.00, tube: "Red" },
  // PCR Panel
  { name: "Respiratory Panel", price: 169.00, tube: "Swab" },
  { name: "Allergy Panel - Inhalent 36 Allergens", price: 125.00, tube: "Red" },
  { name: "Allergy Panel - Food 30 Allergens", price: 125.00, tube: "Red" },
  { name: "STI Panel", price: 125.00, tube: "Swab" },
  { name: "UTI Panel", price: 149.00, tube: "Yellow (Urine Cup)" },
  { name: "Women's Health Panel", price: 179.00, tube: "Swab" },
  // Toxicology
  { name: "Confirmation", price: 60.00, tube: "Yellow (Urine Cup)" },
  { name: "Screening", price: 30.00, tube: "Yellow (Urine Cup)" },
  { name: "Screening + Confirmation", price: 80.00, tube: "Yellow (Urine Cup)" }
];

// Tube color hex map
const tubeColors = {
  "Lavender": "#9b59b6",
  "Green": "#27ae60",
  "Red": "#e74c3c",
  "Yellow (Urine Cup)": "#f1c40f",
  "Swab": "#3498db"
};

// State
const selectedTests = new Set();
let orderData = null;
const CURRENT_ORDER_STORAGE_KEY = 'testgo_current_order';

async function loadLabTests() {
  const response = await fetch('/.netlify/functions/get-test-catalog');
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load test catalog.');
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('No tests are available right now.');
  }

  labTests = payload;
}

// Page navigation
function showPage(pageId) {
  document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// Render test list
function renderTests() {
  const container = document.getElementById('testList');

  if (!Array.isArray(labTests) || labTests.length === 0) {
    container.innerHTML = '<p style="padding:12px;color:#b91c1c;">No tests are available right now.</p>';
    return;
  }

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



// Signature Pad
let signatureCanvas, signatureCtx, isDrawing = false, hasSigned = false;

function setupSignaturePad() {
  signatureCanvas = document.getElementById('signatureCanvas');
  signatureCtx = signatureCanvas.getContext('2d');
  let canvasReady = false;

  function initCanvas() {
    if (canvasReady) return;
    const wrapper = signatureCanvas.parentElement;
    const width = wrapper.clientWidth || 300;
    const height = 200;
    const dpr = window.devicePixelRatio || 1;
    signatureCanvas.style.width = width + 'px';
    signatureCanvas.style.height = height + 'px';
    signatureCanvas.width = width * dpr;
    signatureCanvas.height = height * dpr;
    signatureCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    signatureCtx.strokeStyle = '#333';
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
    canvasReady = true;
  }

  // Observe when canvas becomes visible to init
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      initCanvas();
      observer.disconnect();
    }
  });
  observer.observe(signatureCanvas);

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
    const dpr = window.devicePixelRatio || 1;
    signatureCtx.clearRect(0, 0, signatureCanvas.width / dpr, signatureCanvas.height / dpr);
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

function buildClientOrderSnapshot(order) {
  return {
    orderId: order.orderId,
    firstName: order.firstName,
    lastName: order.lastName,
    dob: order.dob,
    email: order.email,
    phone: order.phone,
    tests: order.tests,
    total: order.total,
    submittedAt: order.submittedAt,
    status: order.status || 'pending'
  };
}

// Show invoice/order summary page
function showInvoicePage() {
  // Patient info
  const patientHtml = `
    <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${orderData.firstName} ${orderData.lastName}</span></div>
    <div class="detail-row"><span class="detail-label">DOB</span><span class="detail-value">${orderData.dob}</span></div>
    <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${orderData.email}</span></div>
    <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${orderData.phone}</span></div>
    <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${orderData.orderId}</span></div>
  `;
  document.getElementById('invoicePatient').innerHTML = patientHtml;

  // Tests list
  let testsHtml = '';
  orderData.tests.forEach(t => {
    testsHtml += `<div class="summary-line"><span>${t.name}</span><span>$${t.price.toFixed(2)}</span></div>`;
  });
  document.getElementById('invoiceTests').innerHTML = testsHtml;

  // Total
  document.getElementById('invoiceTotal').innerHTML = `<div class="summary-total"><span>Total</span><span>$${orderData.total.toFixed(2)}</span></div>`;

  sessionStorage.setItem(CURRENT_ORDER_STORAGE_KEY, JSON.stringify(buildClientOrderSnapshot(orderData)));

  showPage('invoicePage');
}

// Redirect to Stripe payment
function redirectToStripe() {
  showPage('paymentPage');

  fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testNames: orderData.tests.map((test) => test.name),
      orderId: orderData.orderId,
      email: orderData.email
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Payment error: ' + (data.error || 'Unknown error'));
      showPage('invoicePage');
    }
  })
  .catch(err => {
    alert('Could not connect to payment service. Please try again.');
    showPage('invoicePage');
  });
}

// Pay Later flow
function handlePayLater() {
  showPage('paymentPage');
  document.querySelector('#paymentPage .payment-title').textContent = 'Processing your order...';

  sendOrderEmail('pay-later')
    .then(() => {
      window.location.href = `/success.html?order_id=${encodeURIComponent(orderData.orderId)}&payment_type=pay-later`;
    })
    .catch(() => {
      alert('Could not send confirmation email. Please try again.');
      showPage('invoicePage');
    });
}

// Send order email
function sendOrderEmail(paymentType) {
  return fetch('/.netlify/functions/send-order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: orderData.firstName,
      lastName: orderData.lastName,
      email: orderData.email,
      phone: orderData.phone,
      dob: orderData.dob,
      tests: orderData.tests,
      total: orderData.total,
      orderId: orderData.orderId,
      paymentType: paymentType,
      submittedAt: orderData.submittedAt
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('Email failed');
    return res.json();
  });
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
      address: document.getElementById('address').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value.trim(),
      zipcode: document.getElementById('zipcode').value.trim(),
      insurance: document.getElementById('insurance').value,
      race: document.getElementById('race').value,
      ethnicity: document.getElementById('ethnicity').value,
      providerName: document.getElementById('providerName').value.trim(),
      providerNPI: document.getElementById('providerNPI').value.trim(),
      providerEmail: document.getElementById('providerEmail').value.trim(),
      providerPhone: document.getElementById('providerPhone').value.trim(),
      signature: signatureCanvas.toDataURL(),
      total: Array.from(selectedTests).reduce((sum, i) => sum + labTests[i].price, 0)
    };

    // Store and go to invoice
    orderData = { ...formData, orderId: generateOrderId(), submittedAt: new Date().toLocaleString(), status: 'pending' };
    showInvoicePage();
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Welcome page - Get Started
  document.getElementById('getStartedBtn').addEventListener('click', () => {
    showPage('registrationPage');
  });

  // Pay Now button on invoice page
  document.getElementById('payNowBtn').addEventListener('click', redirectToStripe);

  // Pay Later button on invoice page
  document.getElementById('payLaterBtn').addEventListener('click', handlePayLater);

  // Back button on invoice page
  document.getElementById('backToFormBtn').addEventListener('click', () => {
    showPage('registrationPage');
  });

  setupDOBInput();
  setupSignaturePad();
  setupForm();

  const testList = document.getElementById('testList');
  testList.innerHTML = '<p style="padding:12px;color:#666;">Loading available tests...</p>';

  try {
    await loadLabTests();
    renderTests();
  } catch (error) {
    testList.innerHTML = `<p style="padding:12px;color:#b91c1c;">${error.message}</p>`;
  }
});

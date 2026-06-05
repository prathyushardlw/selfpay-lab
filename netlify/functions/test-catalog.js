const fs = require('fs/promises');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const DEFAULT_TEST_CATALOG = [
  { name: 'Amylase', price: 5.0, tube: 'Green' },
  { name: 'Anti-HAV IgM', price: 14.0, tube: 'Red' },
  { name: 'Anti-Hbc', price: 14.0, tube: 'Red' },
  { name: 'Anti-Hbc IgM', price: 14.0, tube: 'Red' },
  { name: 'Anti-HBS', price: 14.0, tube: 'Red' },
  { name: 'Anti-HCV', price: 14.0, tube: 'Red' },
  { name: 'Anti-Tg', price: 14.0, tube: 'Red' },
  { name: 'Anti-TPO', price: 14.0, tube: 'Red' },
  { name: 'CBC with Automated Diff', price: 3.0, tube: 'Lavender' },
  { name: 'Comprehensive Metabolic Panel (CMP)', price: 3.0, tube: 'Green' },
  { name: 'DHEA-S', price: 25.0, tube: 'Red' },
  { name: 'Digoxin', price: 15.0, tube: 'Red' },
  { name: 'Direct Bilirubin', price: 5.0, tube: 'Green' },
  { name: 'Estradiol', price: 25.0, tube: 'Red' },
  { name: 'Ferritin', price: 12.0, tube: 'Red' },
  { name: 'Folate', price: 12.0, tube: 'Red' },
  { name: 'Free PSA', price: 15.0, tube: 'Red' },
  { name: 'Free T3', price: 5.0, tube: 'Red' },
  { name: 'Free T4', price: 8.0, tube: 'Red' },
  { name: 'FSH', price: 15.0, tube: 'Red' },
  { name: 'GGT', price: 8.0, tube: 'Green' },
  { name: 'HBsAg', price: 10.0, tube: 'Red' },
  { name: 'HDL', price: 8.0, tube: 'Green' },
  { name: 'Hemoglobin A1c (HgbA1c)', price: 6.0, tube: 'Lavender' },
  { name: 'Hepatic Profile (Liver Function)', price: 15.0, tube: 'Green' },
  { name: 'Hepatitis Panel', price: 45.0, tube: 'Red' },
  { name: 'HIV Screening', price: 15.0, tube: 'Red' },
  { name: 'Insulin', price: 10.0, tube: 'Red' },
  { name: 'Iron Profile', price: 15.0, tube: 'Green' },
  { name: 'Lactate', price: 10.0, tube: 'Green' },
  { name: 'LDH', price: 6.0, tube: 'Green' },
  { name: 'LDL', price: 12.0, tube: 'Green' },
  { name: 'LH', price: 15.0, tube: 'Red' },
  { name: 'Lipase', price: 6.0, tube: 'Green' },
  { name: 'Lipid Panel', price: 8.0, tube: 'Green' },
  { name: 'Lithium', price: 6.0, tube: 'Red' },
  { name: 'Magnesium', price: 6.0, tube: 'Green' },
  { name: 'Phosphorus', price: 5.0, tube: 'Green' },
  { name: 'Prealbumin', price: 13.0, tube: 'Red' },
  { name: 'Prolactin', price: 15.0, tube: 'Red' },
  { name: 'Renal Panel', price: 8.0, tube: 'Green' },
  { name: 'Rheumatoid Factor', price: 7.0, tube: 'Red' },
  { name: 'Rubella IgG', price: 12.0, tube: 'Red' },
  { name: 'Rubella IgM', price: 12.0, tube: 'Red' },
  { name: 'SHBG', price: 20.0, tube: 'Red' },
  { name: 'Syphilis', price: 15.0, tube: 'Red' },
  { name: 'Testosterone', price: 15.0, tube: 'Red' },
  { name: 'Total Bilirubin', price: 5.0, tube: 'Green' },
  { name: 'Total PSA', price: 15.0, tube: 'Red' },
  { name: 'Total T3', price: 15.0, tube: 'Red' },
  { name: 'Total T4', price: 7.0, tube: 'Red' },
  { name: 'Transferrin', price: 12.0, tube: 'Red' },
  { name: 'TSH', price: 10.0, tube: 'Red' },
  { name: 'T-Uptake', price: 8.0, tube: 'Red' },
  { name: 'Uric Acid', price: 8.0, tube: 'Green' },
  { name: 'Urine Microalbumin', price: 8.0, tube: 'Yellow (Urine Cup)' },
  { name: 'Urine Analysis', price: 6.0, tube: 'Yellow (Urine Cup)' },
  { name: 'Valproic Acid', price: 18.0, tube: 'Red' },
  { name: 'Vancomycin', price: 15.0, tube: 'Red' },
  { name: 'Vitamin B12', price: 15.0, tube: 'Red' },
  { name: 'Vitamin D', price: 25.0, tube: 'Red' }
];

const TEST_CATALOG_KEY = 'catalog';
const LOCAL_CATALOG_FILE = path.join(process.cwd(), '.netlify', 'local-test-catalog.json');

function getManualBlobsOptions() {
  const siteID =
    process.env.NETLIFY_BLOBS_SITE_ID ||
    process.env.NETLIFY_SITE_ID ||
    process.env.SITE_ID ||
    process.env.NETLIFY_SITEID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;

  if (!siteID || !token) {
    return null;
  }

  return { siteID, token };
}

function getTestCatalogStore() {
  return getStore({
    name: 'selfpay-test-catalog',
    consistency: 'strong',
    ...(getManualBlobsOptions() || {})
  });
}

function isBlobsUnavailableError(error) {
  return error?.message?.includes('has not been configured to use Netlify Blobs');
}

function isLocalDevelopment() {
  return process.env.NETLIFY_DEV === 'true' || process.env.URL === 'http://localhost:8888';
}

async function readLocalCatalog() {
  try {
    const data = await fs.readFile(LOCAL_CATALOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function writeLocalCatalog(tests, source) {
  await fs.mkdir(path.dirname(LOCAL_CATALOG_FILE), { recursive: true });
  await fs.writeFile(
    LOCAL_CATALOG_FILE,
    JSON.stringify(
      {
        tests,
        source,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    )
  );
}

function normalizeTest(test) {
  const name = String(test?.name || '').trim();
  const tube = String(test?.tube || '').trim();
  const price = Number(test?.price);

  if (!name) {
    throw new Error('Each test must have a name.');
  }

  if (!tube) {
    throw new Error(`Test "${name}" must have a tube type.`);
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Test "${name}" must have a valid non-negative price.`);
  }

  return {
    name,
    price: Math.round(price * 100) / 100,
    tube
  };
}

function sanitizeCatalog(tests) {
  if (!Array.isArray(tests) || tests.length === 0) {
    throw new Error('The test catalog must contain at least one test.');
  }

  const seenNames = new Set();

  return tests.map((test) => {
    const normalizedTest = normalizeTest(test);
    const lookupKey = normalizedTest.name.toLowerCase();

    if (seenNames.has(lookupKey)) {
      throw new Error(`Duplicate test name: ${normalizedTest.name}`);
    }

    seenNames.add(lookupKey);
    return normalizedTest;
  });
}

async function loadTestCatalog() {
  const defaultCatalog = sanitizeCatalog(DEFAULT_TEST_CATALOG);

  try {
    const testCatalogStore = getTestCatalogStore();
    const storedCatalog = await testCatalogStore.get(TEST_CATALOG_KEY, {
      type: 'json',
      consistency: 'strong'
    });

    if (storedCatalog === null) {
      await testCatalogStore.setJSON(TEST_CATALOG_KEY, defaultCatalog, {
        metadata: { updatedAt: new Date().toISOString(), source: 'default' }
      });
      return defaultCatalog;
    }

    return sanitizeCatalog(storedCatalog);
  } catch (error) {
    if (!isLocalDevelopment() || !isBlobsUnavailableError(error)) {
      if (isBlobsUnavailableError(error)) {
        throw new Error(
          'Netlify Blobs is unavailable. Either run inside a Netlify environment with Blobs enabled, or set NETLIFY_BLOBS_SITE_ID and NETLIFY_BLOBS_TOKEN in the environment.'
        );
      }

      throw error;
    }

    const storedCatalog = await readLocalCatalog();

    if (storedCatalog === null) {
      await writeLocalCatalog(defaultCatalog, 'default');
      return defaultCatalog;
    }

    return sanitizeCatalog(storedCatalog.tests || storedCatalog);
  }
}

async function saveTestCatalog(tests) {
  const sanitizedCatalog = sanitizeCatalog(tests);

  try {
    const testCatalogStore = getTestCatalogStore();

    await testCatalogStore.setJSON(TEST_CATALOG_KEY, sanitizedCatalog, {
      metadata: { updatedAt: new Date().toISOString(), source: 'admin' }
    });
  } catch (error) {
    if (!isLocalDevelopment() || !isBlobsUnavailableError(error)) {
      if (isBlobsUnavailableError(error)) {
        throw new Error(
          'Netlify Blobs is unavailable. Either run inside a Netlify environment with Blobs enabled, or set NETLIFY_BLOBS_SITE_ID and NETLIFY_BLOBS_TOKEN in the environment.'
        );
      }

      throw error;
    }

    await writeLocalCatalog(sanitizedCatalog, 'admin');
  }

  return sanitizedCatalog;
}

async function getTestsByName(testNames) {
  if (!Array.isArray(testNames) || testNames.length === 0) {
    throw new Error('At least one test must be selected.');
  }

  const testCatalog = await loadTestCatalog();
  const testMap = new Map(testCatalog.map((test) => [test.name, test]));

  return testNames.map((testName) => {
    const test = testMap.get(testName);

    if (!test) {
      throw new Error(`Unknown test: ${testName}`);
    }

    return test;
  });
}

async function calculateTotal(testNames) {
  const tests = await getTestsByName(testNames);
  return tests.reduce((sum, test) => sum + test.price, 0);
}

module.exports = {
  DEFAULT_TEST_CATALOG,
  loadTestCatalog,
  saveTestCatalog,
  getTestsByName,
  calculateTotal
};
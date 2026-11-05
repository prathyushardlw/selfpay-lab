const fs = require('fs/promises');
const path = require('path');

function hasMeaningfulBlobCredential(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return false;
  }

  return !/^(optional_|placeholder_|example_|dummy_|changeme|your_)/i.test(trimmed);
}

function getManualBlobsOptions() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.NETLIFY_SITEID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;

  if (!siteID || !token || !hasMeaningfulBlobCredential(siteID) || !hasMeaningfulBlobCredential(token)) {
    return null;
  }

  return { siteID, token };
}

function isBlobConfigError(error) {
  const message = error?.message || '';

  return (
    message.includes('has not been configured to use Netlify Blobs') ||
    message.includes('The environment has not been configured to use Netlify Blobs') ||
    message.includes('Failed to get blob') ||
    message.includes('ECONNREFUSED') ||
    message.includes('401') ||
    error?.statusCode === 400 ||
    error?.status === 400 ||
    error?.code === 'ERR_INVALID_URL'
  );
}

function getBlobStore(name) {
  try {
    const { getStore } = require('@netlify/blobs');
    const manualOptions = getManualBlobsOptions();

    return getStore({
      name,
      consistency: 'strong',
      ...(manualOptions || {})
    });
  } catch (error) {
    if (isBlobConfigError(error)) {
      return null;
    }

    throw error;
  }
}

function getLocalBlobPath(storeName, key) {
  const safeKey = encodeURIComponent(String(key));
  return path.join(process.cwd(), '.netlify', 'local-blobs', storeName, safeKey);
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (typeof value === 'string') {
    return Buffer.from(value, 'utf8');
  }

  if (value == null) {
    return Buffer.alloc(0);
  }

  return Buffer.from(String(value), 'utf8');
}

async function readLocalBlob(storeName, key, options = {}) {
  const filePath = getLocalBlobPath(storeName, key);

  try {
    const value = await fs.readFile(filePath);

    if (options.type === 'arrayBuffer') {
      return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    }

    if (options.type === 'text') {
      return value.toString('utf8');
    }

    return value;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function writeLocalBlob(storeName, key, value) {
  const filePath = getLocalBlobPath(storeName, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, toBuffer(value));
}

async function getBlobValue(storeName, key, options = {}) {
  const store = getBlobStore(storeName);
  if (!store) {
    return readLocalBlob(storeName, key, options);
  }

  try {
    return await store.get(key, options);
  } catch (error) {
    if (isBlobConfigError(error)) {
      return readLocalBlob(storeName, key, options);
    }

    throw error;
  }
}

async function setBlobValue(storeName, key, value) {
  const store = getBlobStore(storeName);
  if (!store) {
    await writeLocalBlob(storeName, key, value);
    return;
  }

  try {
    await store.set(key, value);
  } catch (error) {
    if (isBlobConfigError(error)) {
      await writeLocalBlob(storeName, key, value);
      return;
    }

    throw error;
  }
}

module.exports = {
  getBlobValue,
  setBlobValue,
  getBlobStore,
  getLocalBlobPath,
  isBlobConfigError
};

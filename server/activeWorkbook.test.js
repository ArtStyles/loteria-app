import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { hasBlobCredentials } from './activeWorkbook.js';

const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalStoreId = process.env.BLOB_STORE_ID;

describe('active workbook Blob credentials', () => {
  afterEach(() => {
    restoreEnv('BLOB_READ_WRITE_TOKEN', originalToken);
    restoreEnv('BLOB_STORE_ID', originalStoreId);
  });

  test('accepts Vercel Blob OIDC project connection credentials', () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_STORE_ID = 'store_test_123';

    assert.equal(hasBlobCredentials(), true);
  });
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

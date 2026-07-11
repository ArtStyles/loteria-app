import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import handler from './drawings.js';

describe('vercel drawings api', () => {
  test('returns JSON drawings from the bundled Excel', async () => {
    const response = createMockResponse();

    await handler({ method: 'GET' }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.data.length, 13066);
  });
});

function createMockResponse() {
  return {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

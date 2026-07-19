import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import handler, { createDrawingsHandler } from './drawings.js';

describe('vercel drawings api', () => {
  test('returns JSON drawings from the bundled Excel', async () => {
    const response = createMockResponse();

    await handler({ method: 'GET' }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.data.length, 13066);
  });

  test('accepts POST drawings in the Vercel API handler', async () => {
    const response = createMockResponse();
    const savedDrawing = { date: '2026-07-19', shift: 'T', fijo: '01', first: '02', second: '03' };
    const postHandler = createDrawingsHandler({
      appendDrawing: async (drawing) => ({ count: 13067, drawing }),
    });

    await postHandler({ method: 'POST', body: savedDrawing }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
      ok: true,
      data: {
        count: 13067,
        drawing: savedDrawing,
      },
    });
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

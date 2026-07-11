import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { withMinimumDelay } from './uiTiming.js';

describe('withMinimumDelay', () => {
  test('waits at least the requested time before resolving fast work', async () => {
    const startedAt = Date.now();

    const result = await withMinimumDelay(Promise.resolve('ok'), 40);

    assert.equal(result, 'ok');
    assert.ok(Date.now() - startedAt >= 35);
  });
});

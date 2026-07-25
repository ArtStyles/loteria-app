import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';

describe('vercel SPA routing', () => {
  test('rewrites non-API routes to the app shell', async () => {
    const config = JSON.parse(await readFile('vercel.json', 'utf8'));

    assert.deepEqual(config.rewrites, [
      {
        source: '/((?!api/.*).*)',
        destination: '/index.html',
      },
    ]);
  });
});

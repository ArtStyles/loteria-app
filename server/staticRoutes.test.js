import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, test } from 'node:test';
import { resolveStaticRequest } from './staticRoutes.js';

describe('static SPA routing', () => {
  const rootDir = path.resolve('app-root');

  test('serves the app shell for route URLs without file extensions', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/coincidencias'), {
      type: 'file',
      filePath: path.join(rootDir, 'index.html'),
      contentType: 'text/html; charset=utf-8',
    });

    assert.deepEqual(resolveStaticRequest(rootDir, '/metodos/normal'), {
      type: 'file',
      filePath: path.join(rootDir, 'index.html'),
      contentType: 'text/html; charset=utf-8',
    });
  });

  test('serves asset files with their content type', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/src/styles.css'), {
      type: 'file',
      filePath: path.join(rootDir, 'src', 'styles.css'),
      contentType: 'text/css; charset=utf-8',
    });
  });

  test('does not treat API URLs as app routes', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/api/drawings'), {
      type: 'not-found',
    });
  });

  test('rejects paths that escape the static root', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/%2e%2e/package.json'), {
      type: 'forbidden',
    });
  });
});

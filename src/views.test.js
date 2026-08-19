import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let CoincidencesView;

before(async () => {
  vite = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  ({ CoincidencesView } = await vite.ssrLoadModule('/src/views.jsx'));
});

after(async () => {
  await vite?.close();
});

describe('range coincidence UI states', () => {
  test('keeps edited range values visible while showing the unapplied state', () => {
    const html = renderView({
      rangeFilters: { normalRanges: '7, 6', inverseRanges: '5, 4' },
    });

    assert.match(html, /value="7, 6"/);
    assert.match(html, /value="5, 4"/);
    assert.match(html, /Completa al menos dos rangos para buscar\./);
    assert.doesNotMatch(html, /No hay numeros repetidos entre esos rangos\./);
  });

  test('shows the no-results state after applying two valid ranges', () => {
    const html = renderView({
      rangeFilters: { normalRanges: '2', inverseRanges: '3' },
      rangeSearchReady: true,
    });

    assert.match(html, /No hay numeros repetidos entre esos rangos\./);
    assert.doesNotMatch(html, /Completa al menos dos rangos para buscar\./);
  });

  test('shows applied occurrence counts independently from later field edits', () => {
    const html = renderView({
      rangeFilters: { normalRanges: '11', inverseRanges: '12' },
      rangeMatches: [{
        number: '78',
        normalOccurrences: 3,
        inverseOccurrences: 2,
        matchingRanges: [
          { method: 'normal', count: 9 },
          { method: 'inverse', count: 3 },
        ],
      }],
      rangeSearchReady: true,
    });

    assert.match(html, /value="11"/);
    assert.match(html, /value="12"/);
    assert.match(html, /range-match-number">78</);
    assert.match(html, /Normal: <strong>3<\/strong> veces/);
    assert.match(html, /Inverso: <strong>2<\/strong> veces/);
    assert.match(html, /Rangos: Normal 9, Inverso 3/);
    assert.doesNotMatch(html, /Completa al menos dos rangos para buscar\./);
    assert.doesNotMatch(html, /No hay numeros repetidos entre esos rangos\./);
  });
});

function renderView(overrides = {}) {
  return renderToStaticMarkup(React.createElement(CoincidencesView, {
    filteredMatches: [],
    matchFilters: {
      firstMethod: 'normal',
      firstCount: '',
      secondMethod: 'inverse',
      secondCount: '',
    },
    onSearchMatches() {},
    onSearchRangeMatches() {},
    rangeFilters: { normalRanges: '', inverseRanges: '' },
    rangeMatches: [],
    rangeSearchReady: false,
    setMatchFilters() {},
    setRangeFilters() {},
    ...overrides,
  }));
}

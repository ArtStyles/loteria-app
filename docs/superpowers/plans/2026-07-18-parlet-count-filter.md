# Parlet Count Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exact NORMAL and INVERSO parlet-count controls so the user can search normal/inverse digit coincidences by how many times each parlet has appeared.

**Architecture:** Keep lottery calculations in `src/lib/loteria.js` and expose a small pure helper that filters existing `analysis.matches` rows. Keep React state local to the coincidence panel and filter only the displayed rows; no API or Excel persistence changes are needed.

**Tech Stack:** React 18, Vite, Node `node:test`, plain JavaScript modules.

## Global Constraints

- Existing parlet generation stays unchanged.
- Existing parlet counting stays unchanged.
- The new behavior is a filter over `analysis.matches`, not a different parlet calculation.
- Count inputs accept whole numbers from `0` upward.
- Empty or invalid count values do not filter that side.
- No production calculation code without a failing test first.

---

### Task 1: Match Count Filter Helper

**Files:**
- Modify: `src/lib/loteria.test.js`
- Modify: `src/lib/loteria.js`

**Interfaces:**
- Consumes: match objects shaped as `{ normal: string[], inverse: string[], normalCount: number, inverseCount: number }`
- Produces: `filterMatchesByCounts(matches, filters): object[]`
- Produces: `parseCountFilter(value): number | null`

- [ ] **Step 1: Write the failing tests**

Add imports for `filterMatchesByCounts` and `parseCountFilter`, then add this test block to `src/lib/loteria.test.js`:

```js
describe('match count filters', () => {
  const matches = [
    { normal: ['94', '96'], inverse: ['49', '69'], normalCount: 7, inverseCount: 9 },
    { normal: ['97', '99'], inverse: ['79', '99'], normalCount: 7, inverseCount: 8 },
    { normal: ['89', '98'], inverse: ['98', '89'], normalCount: 4, inverseCount: 9 },
  ];

  test('filters matches by exact normal and inverse counts', () => {
    assert.deepEqual(filterMatchesByCounts(matches, { normalCount: '7', inverseCount: '9' }), [
      matches[0],
    ]);
  });

  test('leaves a side unfiltered when its count is empty or invalid', () => {
    assert.deepEqual(filterMatchesByCounts(matches, { normalCount: '', inverseCount: '9' }), [
      matches[0],
      matches[2],
    ]);
    assert.deepEqual(filterMatchesByCounts(matches, { normalCount: '-1', inverseCount: '' }), matches);
  });

  test('parses only whole non-negative count filters', () => {
    assert.equal(parseCountFilter('0'), 0);
    assert.equal(parseCountFilter('12'), 12);
    assert.equal(parseCountFilter(''), null);
    assert.equal(parseCountFilter('-1'), null);
    assert.equal(parseCountFilter('3.5'), null);
    assert.equal(parseCountFilter('abc'), null);
  });
});
```

- [ ] **Step 2: Run tests and verify the expected failure**

Run: `npm test -- src/lib/loteria.test.js`

Expected: FAIL because `filterMatchesByCounts` and `parseCountFilter` are not exported from `src/lib/loteria.js`.

- [ ] **Step 3: Implement the helper functions**

Add this code to `src/lib/loteria.js` near the other exported analysis helpers:

```js
export function filterMatchesByCounts(matches, filters = {}) {
  const normalCount = parseCountFilter(filters.normalCount);
  const inverseCount = parseCountFilter(filters.inverseCount);

  return matches.filter((match) => {
    const normalMatches = normalCount === null || match.normalCount === normalCount;
    const inverseMatches = inverseCount === null || match.inverseCount === inverseCount;
    return normalMatches && inverseMatches;
  });
}

export function parseCountFilter(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }

  return Number(text);
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- src/lib/loteria.test.js`

Expected: PASS for all `src/lib/loteria.test.js` tests.

### Task 2: Coincidence Panel Controls

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `filterMatchesByCounts(matches, { normalCount, inverseCount })`
- Produces: interactive fields `Normal salio`, `Inverso salio`, and button `Buscar coincidencias`

- [ ] **Step 1: Import the helper**

In `src/main.jsx`, import `filterMatchesByCounts` from `./lib/loteria.js`:

```js
import { filterMatchesByCounts } from './lib/loteria.js';
```

- [ ] **Step 2: Add pending and applied filter state**

Inside `App`, add:

```js
const [matchFilters, setMatchFilters] = useState({ normalCount: '', inverseCount: '' });
const [appliedMatchFilters, setAppliedMatchFilters] = useState({ normalCount: '', inverseCount: '' });
```

Then add:

```js
const filteredMatches = useMemo(() => (
  analysis ? filterMatchesByCounts(analysis.matches, appliedMatchFilters) : []
), [analysis, appliedMatchFilters]);
```

- [ ] **Step 3: Add a submit handler**

Inside `App`, add:

```js
function searchMatches(event) {
  event.preventDefault();
  setAppliedMatchFilters(matchFilters);
}
```

- [ ] **Step 4: Replace the coincidence panel controls**

Replace the current `Coincidencias normal / inverso` panel body in `src/main.jsx` with:

```jsx
<section className="panel">
  <h2>Coincidencias normal / inverso</h2>
  <form className="match-filter" onSubmit={searchMatches}>
    <label>
      Normal salio
      <input
        inputMode="numeric"
        placeholder="7"
        value={matchFilters.normalCount}
        onChange={(event) => setMatchFilters({
          ...matchFilters,
          normalCount: event.target.value.replace(/\D/g, ''),
        })}
      />
    </label>
    <label>
      Inverso salio
      <input
        inputMode="numeric"
        placeholder="9"
        value={matchFilters.inverseCount}
        onChange={(event) => setMatchFilters({
          ...matchFilters,
          inverseCount: event.target.value.replace(/\D/g, ''),
        })}
      />
    </label>
    <button type="submit">Buscar coincidencias</button>
  </form>
  <div className="match-list">
    {filteredMatches.length === 0 && (
      <p className="empty-state">No hay coincidencias para esos valores.</p>
    )}
    {filteredMatches.slice(0, 24).map((match) => (
      <div className="match-row" key={`${match.normal.join('-')}-${match.inverse.join('-')}`}>
        <span>{match.normal.join(' . ')}</span>
        <strong>{match.normalCount}</strong>
        <span>{match.inverse.join(' . ')}</span>
        <strong>{match.inverseCount}</strong>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 5: Add compact filter styling**

Add to `src/styles.css`:

```css
.match-filter {
  align-items: end;
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr auto;
  margin-bottom: 12px;
}

.empty-state {
  background: #f8fafb;
  border: 1px solid #e3eaee;
  border-radius: 6px;
  color: #52616a;
  font-weight: 700;
  margin: 0;
  padding: 10px;
}
```

Extend the existing mobile media query with:

```css
.match-filter {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 6: Run full tests**

Run: `npm test`

Expected: PASS for all tests.

- [ ] **Step 7: Start the app for manual verification**

Run: `npm run start`

Expected: local server logs show `Loteria app lista en http://127.0.0.1:5174` and Vite shows a local URL.

- [ ] **Step 8: Commit**

```bash
git add src/lib/loteria.test.js src/lib/loteria.js src/main.jsx src/styles.css docs/superpowers/plans/2026-07-18-parlet-count-filter.md
git commit -m "Add parlet count coincidence filter"
```

# Configurable Method Digit Coincidences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed normal/inverso count filter with a configurable two-field search that compares selected method parlets by digit signature.

**Architecture:** Keep lottery calculation rules in `src/lib/loteria.js` as pure helpers with unit coverage. React stores the two field selectors locally, calls the helper with `analysis.normalParlets` and `analysis.inverseParlets`, and renders the returned coincidence rows. CSS only adjusts the existing compact filter and result rows.

**Tech Stack:** React 18, Vite 6, Node `node:test`, plain CSS.

## Global Constraints

- Existing normal and inverse method generation stays unchanged.
- Existing parlet counting stays unchanged: a parlet counts when both two-digit numbers appear in the same drawing row, regardless of whether they appear as `Fijo`, `1er Corrido`, or `2do Corrido`.
- Both fields may use the same method if the user wants.
- A digit coincidence is based on the full digit signature of the two parlets being compared.
- Digit order does not matter.
- Duplicate digits count as part of the signature.
- If either count input is empty or invalid, that field has no searchable result set and the app shows an empty state.
- If no digit coincidences exist between the two filtered result sets, the app shows `No hay coincidencias para esos valores.`

---

## File Structure

- Modify `src/lib/loteria.js`: add pure helpers `getParletDigitSignature(parlet)` and `findMethodDigitCoincidences(analysis, filters)`. Keep existing `filterMatchesByCounts` for backward compatibility with current tests unless a later cleanup explicitly removes it.
- Modify `src/lib/loteria.test.js`: add unit coverage for digit signatures, same-method comparisons, different-method comparisons, and empty/invalid count behavior.
- Modify `src/main.jsx`: replace fixed `normalCount`/`inverseCount` state and UI with `firstMethod`/`firstCount` and `secondMethod`/`secondCount`; render rows returned by `findMethodDigitCoincidences`.
- Modify `src/styles.css`: adjust `.match-filter` child controls and result row labels so method names and parlets fit on desktop and mobile.

---

### Task 1: Pure Configurable Coincidence Helper

**Files:**
- Modify: `src/lib/loteria.test.js`
- Modify: `src/lib/loteria.js`

**Interfaces:**
- Consumes: `analysis.normalParlets` and `analysis.inverseParlets`, each containing rows shaped as `{ left: string, right: string, count: number }`
- Produces: `getParletDigitSignature(parlet: { left: string, right: string } | string[]): string`
- Produces: `findMethodDigitCoincidences(analysis, filters): Array<{ first: { method: string, left: string, right: string, count: number }, second: { method: string, left: string, right: string, count: number }, signature: string }>`
- `filters` shape: `{ firstMethod: 'normal' | 'inverse', firstCount: string, secondMethod: 'normal' | 'inverse', secondCount: string }`

- [ ] **Step 1: Write failing tests for the new helper**

Modify the import block in `src/lib/loteria.test.js` to include the new functions:

```js
import {
  buildInverseCombinations,
  buildNormalCombinations,
  buildParlets,
  countParlet,
  filterMatchesByCounts,
  findMethodDigitCoincidences,
  getDrawDigits,
  getParletDigitSignature,
  normalizeNumber,
  parseCountFilter,
  rankNumbers,
} from './loteria.js';
```

Append this describe block after the existing `match count filters` describe block:

```js
describe('configurable method digit coincidences', () => {
  const analysis = {
    normalParlets: [
      { left: '97', right: '81', count: 7 },
      { left: '92', right: '31', count: 7 },
      { left: '11', right: '79', count: 7 },
      { left: '79', right: '18', count: 9 },
      { left: '17', right: '19', count: 9 },
      { left: '90', right: '46', count: 5 },
    ],
    inverseParlets: [
      { left: '79', right: '18', count: 9 },
      { left: '29', right: '13', count: 9 },
      { left: '09', right: '64', count: 9 },
      { left: '11', right: '79', count: 4 },
    ],
  };

  test('builds digit signatures regardless of order while preserving duplicates', () => {
    assert.equal(getParletDigitSignature({ left: '97', right: '81' }), '1789');
    assert.equal(getParletDigitSignature({ left: '79', right: '18' }), '1789');
    assert.equal(getParletDigitSignature({ left: '11', right: '79' }), '1179');
    assert.equal(getParletDigitSignature({ left: '17', right: '19' }), '1179');
  });

  test('finds coincidences between different selected methods and counts', () => {
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '7',
      secondMethod: 'inverse',
      secondCount: '9',
    }), [
      {
        first: { method: 'normal', left: '97', right: '81', count: 7 },
        second: { method: 'inverse', left: '79', right: '18', count: 9 },
        signature: '1789',
      },
      {
        first: { method: 'normal', left: '92', right: '31', count: 7 },
        second: { method: 'inverse', left: '29', right: '13', count: 9 },
        signature: '1239',
      },
    ]);
  });

  test('finds coincidences when both fields use the same method', () => {
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '7',
      secondMethod: 'normal',
      secondCount: '9',
    }), [
      {
        first: { method: 'normal', left: '97', right: '81', count: 7 },
        second: { method: 'normal', left: '79', right: '18', count: 9 },
        signature: '1789',
      },
      {
        first: { method: 'normal', left: '11', right: '79', count: 7 },
        second: { method: 'normal', left: '17', right: '19', count: 9 },
        signature: '1179',
      },
    ]);
  });

  test('returns no coincidences when either count is empty or invalid', () => {
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '',
      secondMethod: 'inverse',
      secondCount: '9',
    }), []);
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '7',
      secondMethod: 'inverse',
      secondCount: 'x',
    }), []);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `findMethodDigitCoincidences` and `getParletDigitSignature` are not exported from `src/lib/loteria.js`.

- [ ] **Step 3: Implement the minimal pure helper**

Add these exported functions after `filterMatchesByCounts` in `src/lib/loteria.js`:

```js
export function getParletDigitSignature(parlet) {
  const pair = Array.isArray(parlet) ? parlet : [parlet.left, parlet.right];
  return pair
    .map(normalizeNumber)
    .join('')
    .split('')
    .sort()
    .join('');
}

export function findMethodDigitCoincidences(analysis, filters = {}) {
  const firstMethod = normalizeMethodFilter(filters.firstMethod);
  const secondMethod = normalizeMethodFilter(filters.secondMethod);
  const firstCount = parseCountFilter(filters.firstCount);
  const secondCount = parseCountFilter(filters.secondCount);

  if (!analysis || firstCount === null || secondCount === null) {
    return [];
  }

  const firstRows = getParletRowsByMethod(analysis, firstMethod)
    .filter((row) => row.count === firstCount);
  const secondRowsBySignature = groupRowsBySignature(
    getParletRowsByMethod(analysis, secondMethod)
      .filter((row) => row.count === secondCount),
  );

  return firstRows.flatMap((firstRow) => {
    const signature = getParletDigitSignature(firstRow);
    const secondRows = secondRowsBySignature.get(signature) || [];

    return secondRows.map((secondRow) => ({
      first: buildMethodParlet(firstMethod, firstRow),
      second: buildMethodParlet(secondMethod, secondRow),
      signature,
    }));
  });
}
```

Add these private helpers near the bottom of `src/lib/loteria.js`, before `drawingNumbers`:

```js
function normalizeMethodFilter(value) {
  return value === 'inverse' ? 'inverse' : 'normal';
}

function getParletRowsByMethod(analysis, method) {
  return method === 'inverse'
    ? analysis.inverseParlets || []
    : analysis.normalParlets || [];
}

function groupRowsBySignature(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const signature = getParletDigitSignature(row);
    if (!grouped.has(signature)) {
      grouped.set(signature, []);
    }
    grouped.get(signature).push(row);
  });

  return grouped;
}

function buildMethodParlet(method, row) {
  return {
    method,
    left: row.left,
    right: row.right,
    count: row.count,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/loteria.js src/lib/loteria.test.js
git commit -m "Add configurable digit coincidence helper"
```

---

### Task 2: React Coincidence Panel

**Files:**
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `findMethodDigitCoincidences(analysis, filters)` from Task 1
- Produces: a panel where Field 1 and Field 2 each choose `normal` or `inverse` plus an exact count

- [ ] **Step 1: Replace the import**

Change the `src/main.jsx` lottery import from:

```js
import { filterMatchesByCounts } from './lib/loteria.js';
```

to:

```js
import { findMethodDigitCoincidences } from './lib/loteria.js';
```

- [ ] **Step 2: Replace match filter state shape**

Replace:

```js
const [matchFilters, setMatchFilters] = useState({ normalCount: '', inverseCount: '' });
const [appliedMatchFilters, setAppliedMatchFilters] = useState({ normalCount: '', inverseCount: '' });
```

with:

```js
const defaultMatchFilters = {
  firstMethod: 'normal',
  firstCount: '',
  secondMethod: 'inverse',
  secondCount: '',
};
const [matchFilters, setMatchFilters] = useState(defaultMatchFilters);
const [appliedMatchFilters, setAppliedMatchFilters] = useState(defaultMatchFilters);
```

- [ ] **Step 3: Replace filtered match calculation**

Replace:

```js
const filteredMatches = useMemo(() => (
  analysis ? filterMatchesByCounts(analysis.matches, appliedMatchFilters) : []
), [analysis, appliedMatchFilters]);
```

with:

```js
const filteredMatches = useMemo(() => (
  analysis ? findMethodDigitCoincidences(analysis, appliedMatchFilters) : []
), [analysis, appliedMatchFilters]);
```

- [ ] **Step 4: Replace the filter form JSX**

Replace the current `<form className="match-filter" onSubmit={searchMatches}>...</form>` inside the coincidence panel with:

```jsx
<form className="match-filter" onSubmit={searchMatches}>
  <label>
    Campo 1
    <div className="match-field-controls">
      <select
        value={matchFilters.firstMethod}
        onChange={(event) => setMatchFilters({
          ...matchFilters,
          firstMethod: event.target.value,
        })}
      >
        <option value="normal">Normal</option>
        <option value="inverse">Inverso</option>
      </select>
      <input
        inputMode="numeric"
        placeholder="7"
        value={matchFilters.firstCount}
        onChange={(event) => setMatchFilters({
          ...matchFilters,
          firstCount: event.target.value.replace(/\D/g, ''),
        })}
      />
    </div>
  </label>
  <label>
    Campo 2
    <div className="match-field-controls">
      <select
        value={matchFilters.secondMethod}
        onChange={(event) => setMatchFilters({
          ...matchFilters,
          secondMethod: event.target.value,
        })}
      >
        <option value="normal">Normal</option>
        <option value="inverse">Inverso</option>
      </select>
      <input
        inputMode="numeric"
        placeholder="9"
        value={matchFilters.secondCount}
        onChange={(event) => setMatchFilters({
          ...matchFilters,
          secondCount: event.target.value.replace(/\D/g, ''),
        })}
      />
    </div>
  </label>
  <button type="submit">Buscar coincidencias</button>
</form>
```

- [ ] **Step 5: Replace result row rendering**

Replace the current `filteredMatches.slice(0, 24).map(...)` block with:

```jsx
{filteredMatches.slice(0, 24).map((match) => (
  <div
    className="match-row"
    key={`${match.first.method}-${match.first.left}-${match.first.right}-${match.second.method}-${match.second.left}-${match.second.right}`}
  >
    <MatchParlet match={match.first} />
    <strong>{match.first.count}</strong>
    <MatchParlet match={match.second} />
    <strong>{match.second.count}</strong>
  </div>
))}
```

Add this component below `NumberInput`:

```jsx
function MatchParlet({ match }) {
  return (
    <span className="match-parlet">
      <small>{formatMethodLabel(match.method)}</small>
      {match.left} . {match.right}
    </span>
  );
}
```

Add this helper below `MatchParlet`:

```js
function formatMethodLabel(method) {
  return method === 'inverse' ? 'Inverso' : 'Normal';
}
```

- [ ] **Step 6: Run tests and the local app**

Run: `npm test`

Expected: PASS.

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL and the app renders. Stop the dev server after checking the panel loads.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/main.jsx
git commit -m "Update coincidence panel controls"
```

---

### Task 3: Styling and Final Verification

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `.match-field-controls` and `.match-parlet` markup from Task 2
- Produces: responsive controls and readable result rows

- [ ] **Step 1: Add field control and parlet label styles**

Add this CSS after the existing `.match-filter` block:

```css
.match-field-controls {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(110px, 0.4fr) minmax(80px, 0.6fr);
}

.match-parlet {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.match-parlet small {
  color: #52616a;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Add mobile control layout**

Inside the existing `@media (max-width: 980px)` block, after the `.match-filter` rule, add:

```css
  .match-field-controls {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Run the app locally and manually verify the workflow**

Run: `npm run start`

Expected: the server and Vite dev app start. Open the Vite URL.

Manual checks:
- Select `Normal` and enter `7` in Campo 1.
- Select `Normal` and enter `9` in Campo 2.
- Press `Buscar coincidencias`.
- Confirm rows, if present, show method labels on both sides and only parlets with matching digit signatures.
- Select `Normal` and enter `7` in Campo 1.
- Select `Inverso` and enter `9` in Campo 2.
- Press `Buscar coincidencias`.
- Confirm the same panel supports different-method comparisons.
- Clear one count and press `Buscar coincidencias`.
- Confirm the empty state appears.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/styles.css
git commit -m "Style configurable coincidence search"
```

---

## Final Verification

- [ ] Run `npm test` and confirm PASS.
- [ ] Run `git status --short` and confirm only expected untracked local artifacts remain.
- [ ] Summarize the helper behavior, UI behavior, and verification commands in the final response.

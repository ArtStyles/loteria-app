# Route-Based App Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single long lottery dashboard into a route-based React application with one focused screen per workflow.

**Architecture:** Add React Router in declarative mode and keep lottery data loading in one shared app shell. Split the current `src/main.jsx` into route metadata, a routed app shell, focused view components, and small reusable controls. Add local server and Vercel SPA fallback support so direct loads such as `/metodos/normal` return the React app while `/api/*` keeps API behavior.

**Tech Stack:** React 18, Vite 6, React Router, Node `node:test`, plain CSS, local Node HTTP server, Vercel serverless API folder.

## Global Constraints

- Use real client-side routes with React Router and clean URLs.
- The app will keep one shared data/analysis source, but each route will present only the information needed for that workflow.
- Data loading remains shared at the app shell level.
- Existing API endpoints remain unchanged: `/api/drawings`, `/api/analysis`, `/api/workbook`.
- Client-side routes must load directly in development and production.
- API routes keep their existing behavior and must not be swallowed by the client-side fallback.
- Avoid one huge stacked dashboard.
- Each route should have one primary job.
- Keep the UI utilitarian and focused.
- No reintroducing rankings or parlet summary tables.

---

## References

- React Router official declarative installation and routing docs use `react-router` and show `BrowserRouter`, `Routes`, and `Route` from that package.
- Vercel official rewrites docs support rewriting requests without changing the visible URL; the project needs a SPA fallback that excludes `/api/*`.

---

## File Structure

- Create `src/routes.js`: route constants, navigation labels, method metadata, and route title lookup.
- Create `src/routes.test.js`: unit tests for approved route paths and navigation metadata.
- Modify `package.json`: add `react-router` dependency and a `build` script.
- Modify `pnpm-lock.yaml`: dependency lock update from `pnpm add react-router`.
- Create `server/staticRoutes.js`: pure static/client-route resolver for local server fallback.
- Create `server/staticRoutes.test.js`: tests for serving `index.html` for client routes, preserving asset paths, rejecting traversal, and not swallowing `/api/*`.
- Modify `server/index.js`: use the static route resolver in `serveStatic`.
- Create `vercel.json`: production SPA fallback rewrite excluding `/api/*`.
- Create `vercel.test.js`: verifies the rewrite config excludes API paths and points client routes at `index.html`.
- Create `src/App.jsx`: app shell, shared data state, route definitions.
- Create `src/views.jsx`: focused route views.
- Create `src/components.jsx`: reusable controls and display components.
- Modify `src/main.jsx`: mount `App` inside `BrowserRouter`.
- Modify `src/styles.css`: add navigation, route layout, method grids, and responsive route styles.

---

### Task 1: Route Metadata And Router Dependency

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/routes.js`
- Create: `src/routes.test.js`

**Interfaces:**
- Produces: `appRoutes: Record<string, string>`
- Produces: `navItems: Array<{ label: string, path: string }>`
- Produces: `methodRoutes: Array<{ key: 'digits' | 'normal' | 'inverse', label: string, path: string }>`
- Produces: `getRouteTitle(pathname: string): string`

- [ ] **Step 1: Write failing route metadata tests**

Create `src/routes.test.js`:

```js
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  appRoutes,
  getRouteTitle,
  methodRoutes,
  navItems,
} from './routes.js';

describe('route metadata', () => {
  test('defines the approved app route paths', () => {
    assert.deepEqual(appRoutes, {
      home: '/',
      database: '/base-datos',
      drawings: '/tiradas',
      digits: '/metodos/digitos',
      normal: '/metodos/normal',
      inverse: '/metodos/inverso',
      coincidences: '/coincidencias',
    });
  });

  test('builds primary navigation in the approved order', () => {
    assert.deepEqual(navItems.map((item) => [item.label, item.path]), [
      ['Inicio', '/'],
      ['Base de datos', '/base-datos'],
      ['Tiradas', '/tiradas'],
      ['Digitos', '/metodos/digitos'],
      ['Normal', '/metodos/normal'],
      ['Inverso', '/metodos/inverso'],
      ['Coincidencias', '/coincidencias'],
    ]);
  });

  test('groups method routes separately from database and drawing routes', () => {
    assert.deepEqual(methodRoutes, [
      { key: 'digits', label: 'Digitos', path: '/metodos/digitos' },
      { key: 'normal', label: 'Normal', path: '/metodos/normal' },
      { key: 'inverse', label: 'Inverso', path: '/metodos/inverso' },
    ]);
  });

  test('returns readable titles for route paths', () => {
    assert.equal(getRouteTitle('/'), 'Inicio');
    assert.equal(getRouteTitle('/metodos/normal'), 'Metodo normal');
    assert.equal(getRouteTitle('/ruta-desconocida'), 'No encontrado');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `src/routes.js` does not exist.

- [ ] **Step 3: Install React Router and add build script**

Run:

```bash
pnpm add react-router
```

Modify `package.json` scripts so they include:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "server": "node server/index.js",
    "start": "concurrently \"npm run server\" \"npm run dev\"",
    "build": "vite build",
    "test": "node --test"
  }
}
```

- [ ] **Step 4: Implement route metadata**

Create `src/routes.js`:

```js
export const appRoutes = {
  home: '/',
  database: '/base-datos',
  drawings: '/tiradas',
  digits: '/metodos/digitos',
  normal: '/metodos/normal',
  inverse: '/metodos/inverso',
  coincidences: '/coincidencias',
};

export const navItems = [
  { label: 'Inicio', path: appRoutes.home },
  { label: 'Base de datos', path: appRoutes.database },
  { label: 'Tiradas', path: appRoutes.drawings },
  { label: 'Digitos', path: appRoutes.digits },
  { label: 'Normal', path: appRoutes.normal },
  { label: 'Inverso', path: appRoutes.inverse },
  { label: 'Coincidencias', path: appRoutes.coincidences },
];

export const methodRoutes = [
  { key: 'digits', label: 'Digitos', path: appRoutes.digits },
  { key: 'normal', label: 'Normal', path: appRoutes.normal },
  { key: 'inverse', label: 'Inverso', path: appRoutes.inverse },
];

const routeTitles = {
  [appRoutes.home]: 'Inicio',
  [appRoutes.database]: 'Base de datos',
  [appRoutes.drawings]: 'Tiradas',
  [appRoutes.digits]: 'Digitos',
  [appRoutes.normal]: 'Metodo normal',
  [appRoutes.inverse]: 'Metodo inverso',
  [appRoutes.coincidences]: 'Coincidencias',
};

export function getRouteTitle(pathname) {
  return routeTitles[pathname] || 'No encontrado';
}
```

- [ ] **Step 5: Run tests and build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS and Vite writes `dist/`.

- [ ] **Step 6: Commit Task 1**

```bash
git add package.json pnpm-lock.yaml src/routes.js src/routes.test.js
git commit -m "Add route metadata and router dependency"
```

---

### Task 2: Local And Production Route Fallbacks

**Files:**
- Create: `server/staticRoutes.js`
- Create: `server/staticRoutes.test.js`
- Modify: `server/index.js`
- Create: `vercel.json`
- Create: `vercel.test.js`

**Interfaces:**
- Produces: `resolveStaticRequest(rootDir: string, urlPath: string): { type: 'file', filePath: string, contentType: string } | { type: 'forbidden' } | { type: 'not-found' }`
- Consumes: local server `serveStatic(urlPath, response)`

- [ ] **Step 1: Write failing static fallback tests**

Create `server/staticRoutes.test.js`:

```js
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import path from 'node:path';
import { resolveStaticRequest } from './staticRoutes.js';

describe('static route fallback', () => {
  const rootDir = path.resolve('app-root');

  test('serves index.html for the app root', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/'), {
      type: 'file',
      filePath: path.join(rootDir, 'index.html'),
      contentType: 'text/html; charset=utf-8',
    });
  });

  test('serves index.html for client-side app routes', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/metodos/normal'), {
      type: 'file',
      filePath: path.join(rootDir, 'index.html'),
      contentType: 'text/html; charset=utf-8',
    });
    assert.deepEqual(resolveStaticRequest(rootDir, '/coincidencias'), {
      type: 'file',
      filePath: path.join(rootDir, 'index.html'),
      contentType: 'text/html; charset=utf-8',
    });
  });

  test('serves asset paths directly when they have extensions', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/src/main.jsx'), {
      type: 'file',
      filePath: path.join(rootDir, 'src', 'main.jsx'),
      contentType: 'text/javascript; charset=utf-8',
    });
    assert.deepEqual(resolveStaticRequest(rootDir, '/src/styles.css'), {
      type: 'file',
      filePath: path.join(rootDir, 'src', 'styles.css'),
      contentType: 'text/css; charset=utf-8',
    });
  });

  test('does not swallow API paths into the SPA fallback', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/api/missing'), {
      type: 'not-found',
    });
  });

  test('rejects traversal outside the app root', () => {
    assert.deepEqual(resolveStaticRequest(rootDir, '/../secret.txt'), {
      type: 'forbidden',
    });
  });
});
```

Create `vercel.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';

describe('vercel SPA routing config', () => {
  test('rewrites non-api routes to index.html without matching API routes', async () => {
    const config = JSON.parse(await readFile(new URL('./vercel.json', import.meta.url), 'utf8'));

    assert.deepEqual(config.rewrites, [
      {
        source: '/((?!api/.*).*)',
        destination: '/index.html',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `server/staticRoutes.js` and `vercel.json` do not exist.

- [ ] **Step 3: Implement static route resolver**

Create `server/staticRoutes.js`:

```js
import path from 'node:path';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

export function resolveStaticRequest(rootDir, urlPath) {
  if (urlPath.startsWith('/api/')) {
    return { type: 'not-found' };
  }

  const decodedPath = decodeURIComponent(urlPath);
  const targetPath = shouldServeAppShell(decodedPath) ? '/index.html' : decodedPath;
  const rootPath = path.resolve(rootDir);
  const filePath = path.resolve(rootPath, `.${targetPath}`);

  if (!isInsideRoot(rootPath, filePath)) {
    return { type: 'forbidden' };
  }

  return {
    type: 'file',
    filePath,
    contentType: getContentType(filePath),
  };
}

function shouldServeAppShell(urlPath) {
  return urlPath === '/' || path.extname(urlPath) === '';
}

function isInsideRoot(rootPath, filePath) {
  return filePath === rootPath || filePath.startsWith(`${rootPath}${path.sep}`);
}

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath)] || 'application/octet-stream';
}
```

- [ ] **Step 4: Wire resolver into local server**

Modify `server/index.js`:

```js
import { resolveStaticRequest } from './staticRoutes.js';
```

Remove the local `mimeTypes` constant from `server/index.js`.

Replace `serveStatic` with:

```js
async function serveStatic(urlPath, response) {
  const staticRequest = resolveStaticRequest(rootDir, urlPath);

  if (staticRequest.type === 'forbidden') {
    return sendText(response, 'No permitido', 403);
  }

  if (staticRequest.type === 'not-found') {
    return sendText(response, 'No encontrado', 404);
  }

  try {
    const content = await readFile(staticRequest.filePath);
    response.writeHead(200, { 'Content-Type': staticRequest.contentType });
    response.end(content);
  } catch {
    sendText(response, 'No encontrado', 404);
  }
}
```

- [ ] **Step 5: Add Vercel SPA fallback config**

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ]
}
```

- [ ] **Step 6: Run tests and local direct-route checks**

Run: `npm test`

Expected: PASS.

Run the local API and app:

```bash
npm run server
npm run dev -- --port 5183
```

In a second terminal check:

```bash
curl -i http://127.0.0.1:5174/metodos/normal
curl -i http://127.0.0.1:5174/api/missing
curl -i http://127.0.0.1:5174/api/drawings
```

Expected:
- `/metodos/normal` returns `200` with `text/html`.
- `/api/missing` returns `404`.
- `/api/drawings` returns JSON.

- [ ] **Step 7: Commit Task 2**

```bash
git add server/index.js server/staticRoutes.js server/staticRoutes.test.js vercel.json vercel.test.js
git commit -m "Add SPA route fallback"
```

---

### Task 3: Routed App Shell And Views

**Files:**
- Create: `src/App.jsx`
- Create: `src/views.jsx`
- Create: `src/components.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `appRoutes`, `navItems` from `src/routes.js`
- Consumes: `findMethodDigitCoincidences(analysis, filters)` from `src/lib/loteria.js`
- Produces: a routed app with shared data state and focused route views

- [ ] **Step 1: Move reusable controls into `src/components.jsx`**

Create `src/components.jsx`:

```jsx
export function NumberInput({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input
        inputMode="numeric"
        maxLength="2"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 2))}
      />
    </label>
  );
}

export function MatchParlet({ match }) {
  return (
    <span className="match-parlet">
      <small>{formatMethodLabel(match.method)}</small>
      {match.left} . {match.right}
    </span>
  );
}

export function MethodNumberGrid({ title, items }) {
  return (
    <section className="panel route-panel">
      <h2>{title}</h2>
      <div className="method-number-grid">
        {items.map((item) => <span className="chip method-number" key={item}>{item}</span>)}
      </div>
    </section>
  );
}

export function formatMethodLabel(method) {
  return method === 'inverse' ? 'Inverso' : 'Normal';
}
```

- [ ] **Step 2: Create focused route views**

Create `src/views.jsx`:

```jsx
import { Link } from 'react-router';
import { appRoutes } from './routes.js';
import { MatchParlet, MethodNumberGrid, NumberInput } from './components.jsx';

export function HomeView({ drawings, status }) {
  const latest = drawings.at(-1);

  return (
    <section className="home-grid">
      <div className="panel home-summary">
        <p className="eyebrow">Resumen</p>
        <h2>Panel principal</h2>
        <div className="summary-grid">
          <SummaryItem label="Estado" value={status} />
          <SummaryItem label="Tiradas" value={drawings.length.toLocaleString('es')} />
          <SummaryItem label="Ultima fecha" value={latest?.date || 'Sin datos'} />
          <SummaryItem label="Ultimo turno" value={latest?.shift || 'Sin datos'} />
        </div>
      </div>
      <div className="panel quick-actions">
        <h2>Accesos</h2>
        <div className="quick-action-grid">
          <Link to={appRoutes.drawings}>Nueva tirada</Link>
          <Link to={appRoutes.normal}>Metodo normal</Link>
          <Link to={appRoutes.inverse}>Metodo inverso</Link>
          <Link to={appRoutes.coincidences}>Coincidencias</Link>
        </div>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function DatabaseView({
  filter,
  filteredDrawings,
  isLoading,
  setFilter,
  setWorkbookFile,
  uploadWorkbook,
  workbookFile,
}) {
  return (
    <section className="route-stack">
      <form className="panel form-panel" onSubmit={uploadWorkbook}>
        <div className="panel-title">
          <h2>Cargar BD</h2>
          <button type="submit" disabled={isLoading}>Cargar</button>
        </div>
        <label>
          Nuevo Excel
          <input
            type="file"
            accept=".xlsx"
            onChange={(event) => setWorkbookFile(event.target.files?.[0] || null)}
          />
        </label>
        {workbookFile && <p className="file-name">{workbookFile.name}</p>}
      </form>

      <section className="panel database-panel">
        <div className="panel-title">
          <h2>Base de datos</h2>
          <input
            aria-label="Filtrar fecha, turno o numero"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Turno</th>
                <th>Fijo</th>
                <th>1er</th>
                <th>2do</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrawings.map((drawing) => (
                <tr key={`${drawing.date}-${drawing.shift}`}>
                  <td>{drawing.date}</td>
                  <td>{drawing.shift}</td>
                  <td>{drawing.fijo}</td>
                  <td>{drawing.first}</td>
                  <td>{drawing.second}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export function DrawingsView({ analyzeManual, form, setForm, submitDrawing }) {
  return (
    <form className="panel form-panel drawing-route" onSubmit={submitDrawing}>
      <div className="panel-title">
        <h2>Nueva tirada</h2>
        <button type="submit">Guardar</button>
      </div>
      <label>
        Fecha
        <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
      </label>
      <label>
        Turno
        <select value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value })}>
          <option value="T">Tarde</option>
          <option value="N">Noche</option>
        </select>
      </label>
      <div className="number-grid">
        <NumberInput label="Fijo" value={form.fijo} onChange={(value) => setForm({ ...form, fijo: value })} />
        <NumberInput label="1er Corrido" value={form.first} onChange={(value) => setForm({ ...form, first: value })} />
        <NumberInput label="2do Corrido" value={form.second} onChange={(value) => setForm({ ...form, second: value })} />
      </div>
      <button className="secondary" type="button" onClick={analyzeManual}>Analizar estos numeros</button>
    </form>
  );
}

export function DigitsView({ analysis }) {
  if (!analysis) return <EmptyRouteState text="No hay analisis disponible." />;

  return (
    <section className="method-route-grid">
      <MethodNumberGrid title="Digitos que salieron" items={analysis.digits.present} />
      <MethodNumberGrid title="Digitos que no salieron" items={analysis.digits.missing} />
    </section>
  );
}

export function MethodView({ items, title }) {
  return <MethodNumberGrid title={title} items={items || []} />;
}

export function CoincidencesView({
  filteredMatches,
  matchFilters,
  searchMatches,
  setMatchFilters,
}) {
  return (
    <section className="panel route-panel">
      <h2>Coincidencias normal / inverso</h2>
      <form className="match-filter" onSubmit={searchMatches}>
        <MatchFilterField
          count={matchFilters.firstCount}
          label="Campo 1"
          method={matchFilters.firstMethod}
          onCountChange={(firstCount) => setMatchFilters({ ...matchFilters, firstCount })}
          onMethodChange={(firstMethod) => setMatchFilters({ ...matchFilters, firstMethod })}
        />
        <MatchFilterField
          count={matchFilters.secondCount}
          label="Campo 2"
          method={matchFilters.secondMethod}
          onCountChange={(secondCount) => setMatchFilters({ ...matchFilters, secondCount })}
          onMethodChange={(secondMethod) => setMatchFilters({ ...matchFilters, secondMethod })}
        />
        <button type="submit">Buscar coincidencias</button>
      </form>
      <div className="match-list">
        {filteredMatches.length === 0 && (
          <p className="empty-state">No hay coincidencias para esos valores.</p>
        )}
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
      </div>
    </section>
  );
}

function MatchFilterField({ count, label, method, onCountChange, onMethodChange }) {
  return (
    <label>
      {label}
      <div className="match-field-controls">
        <select value={method} onChange={(event) => onMethodChange(event.target.value)}>
          <option value="normal">Normal</option>
          <option value="inverse">Inverso</option>
        </select>
        <input
          inputMode="numeric"
          value={count}
          onChange={(event) => onCountChange(event.target.value.replace(/\D/g, ''))}
        />
      </div>
    </label>
  );
}

export function NotFoundView() {
  return (
    <section className="panel route-panel">
      <h2>No encontrado</h2>
      <p>Esta ruta no existe.</p>
      <Link to={appRoutes.home}>Volver al inicio</Link>
    </section>
  );
}

function EmptyRouteState({ text }) {
  return <p className="empty-state">{text}</p>;
}
```

- [ ] **Step 3: Create routed app shell**

Create `src/App.jsx`:

```jsx
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import { findMethodDigitCoincidences } from './lib/loteria.js';
import { appRoutes, navItems } from './routes.js';
import { withMinimumDelay } from './lib/uiTiming.js';
import {
  CoincidencesView,
  DatabaseView,
  DigitsView,
  DrawingsView,
  HomeView,
  MethodView,
  NotFoundView,
} from './views.jsx';

const defaultMatchFilters = {
  firstMethod: 'normal',
  firstCount: '',
  secondMethod: 'inverse',
  secondCount: '',
};

export default function App() {
  const [drawings, setDrawings] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Cargando datos...');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [matchFilters, setMatchFilters] = useState(defaultMatchFilters);
  const [appliedMatchFilters, setAppliedMatchFilters] = useState(defaultMatchFilters);
  const [workbookFile, setWorkbookFile] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    shift: 'T',
    fijo: '',
    first: '',
    second: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(sourceNumbers) {
    setError('');
    setIsLoading(true);

    try {
      await withMinimumDelay((async () => {
        const drawingsResponse = await fetch('/api/drawings');
        const drawingsPayload = await readJsonResponse(drawingsResponse);
        if (!drawingsPayload.ok) {
          throw new Error(drawingsPayload.error);
        }

        const nextDrawings = drawingsPayload.data;
        setDrawings(nextDrawings);

        const latest = nextDrawings.at(-1);
        const numbers = sourceNumbers || (latest ? [latest.fijo, latest.first, latest.second] : ['00', '01', '02']);
        const analysisResponse = await fetch(`/api/analysis?numbers=${numbers.join(',')}`);
        const analysisPayload = await readJsonResponse(analysisResponse);
        if (analysisPayload.ok) {
          setAnalysis(analysisPayload.data);
        }

        setStatus(`${nextDrawings.length.toLocaleString('es')} tiradas cargadas`);
      })(), 900);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitDrawing(event) {
    event.preventDefault();
    setError('');
    setStatus('Guardando tirada...');

    const response = await fetch('/api/drawings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = await readJsonResponse(response);

    if (!payload.ok) {
      setError(payload.error);
      setStatus('No se guardo la tirada');
      return;
    }

    setForm({ ...form, fijo: '', first: '', second: '' });
    await loadData();
  }

  function analyzeManual(event) {
    event.preventDefault();
    loadData([form.fijo || '0', form.first || '0', form.second || '0']);
  }

  function searchMatches(event) {
    event.preventDefault();
    setAppliedMatchFilters(matchFilters);
  }

  async function uploadWorkbook(event) {
    event.preventDefault();
    if (!workbookFile) {
      setError('Selecciona un archivo Excel .xlsx.');
      return;
    }

    setError('');
    setIsLoading(true);
    setStatus('Cargando nueva base de datos...');

    try {
      await withMinimumDelay((async () => {
        const response = await fetch('/api/workbook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'X-File-Name': workbookFile.name,
          },
          body: workbookFile,
        });
        const payload = await readJsonResponse(response);
        if (!payload.ok) {
          throw new Error(payload.error);
        }
      })(), 900);

      setWorkbookFile(null);
      await loadData();
    } catch (uploadError) {
      setError(uploadError.message);
      setStatus('No se pudo cargar la base');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredDrawings = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return drawings.slice(-250).reverse();
    return drawings
      .filter((drawing) => Object.values(drawing).join(' ').toLowerCase().includes(term))
      .slice(-250)
      .reverse();
  }, [drawings, filter]);

  const filteredMatches = useMemo(() => (
    analysis ? findMethodDigitCoincidences(analysis, appliedMatchFilters) : []
  ), [analysis, appliedMatchFilters]);

  return (
    <main className="app-shell">
      {isLoading && (
        <div className="loader-overlay" role="status" aria-live="polite">
          <div className="loader-box">
            <div className="spinner" />
            <strong>Actualizando datos</strong>
            <span>Consultando el Excel y recalculando el metodo...</span>
          </div>
        </div>
      )}

      <header className="topbar">
        <div>
          <p className="eyebrow">Base Excel conectada</p>
          <h1>Loteria Florida</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => loadData()} disabled={isLoading}>Actualizar</button>
          <div className="status-pill">{status}</div>
        </div>
      </header>

      <nav className="app-nav" aria-label="Secciones">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end={item.path === appRoutes.home}
            key={item.path}
            to={item.path}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {error && <div className="alert">{error}</div>}

      <Routes>
        <Route path={appRoutes.home} element={<HomeView drawings={drawings} status={status} />} />
        <Route
          path={appRoutes.database}
          element={(
            <DatabaseView
              filter={filter}
              filteredDrawings={filteredDrawings}
              isLoading={isLoading}
              setFilter={setFilter}
              setWorkbookFile={setWorkbookFile}
              uploadWorkbook={uploadWorkbook}
              workbookFile={workbookFile}
            />
          )}
        />
        <Route
          path={appRoutes.drawings}
          element={<DrawingsView analyzeManual={analyzeManual} form={form} setForm={setForm} submitDrawing={submitDrawing} />}
        />
        <Route path={appRoutes.digits} element={<DigitsView analysis={analysis} />} />
        <Route path={appRoutes.normal} element={<MethodView title="Metodo normal" items={analysis?.normal || []} />} />
        <Route path={appRoutes.inverse} element={<MethodView title="Metodo inverso" items={analysis?.inverse || []} />} />
        <Route
          path={appRoutes.coincidences}
          element={(
            <CoincidencesView
              filteredMatches={filteredMatches}
              matchFilters={matchFilters}
              searchMatches={searchMatches}
              setMatchFilters={setMatchFilters}
            />
          )}
        />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </main>
  );
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('La API no devolvio JSON. Revisa que las rutas /api esten desplegadas.');
  }
}
```

- [ ] **Step 4: Replace `src/main.jsx` with the router mount**

Replace `src/main.jsx` with:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
```

- [ ] **Step 5: Run tests and build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/App.jsx src/components.jsx src/main.jsx src/views.jsx
git commit -m "Split app into routed views"
```

---

### Task 4: Route Layout And Visual Polish

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `.app-nav`, `.nav-link`, `.route-stack`, `.home-grid`, `.summary-grid`, `.method-number-grid`, `.route-panel`
- Produces: responsive application layout with focused route screens

- [ ] **Step 1: Remove dashboard-specific layout rules no longer used**

In `src/styles.css`, remove rules that only support the old full dashboard:

```css
.workspace { ... }
.side-stack { ... }
```

Keep `.method-grid` only if it is still used. If Task 3 no longer uses `.method-grid`, remove it too.

- [ ] **Step 2: Add route navigation styles**

Add after `.topbar-actions`:

```css
.app-nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nav-link {
  background: #ffffff;
  border: 1px solid #dce3e7;
  border-radius: 6px;
  color: #172026;
  font-size: 14px;
  font-weight: 800;
  padding: 10px 12px;
  text-decoration: none;
}

.nav-link.active {
  background: #0f766e;
  border-color: #0f766e;
  color: #ffffff;
}
```

- [ ] **Step 3: Add route surface styles**

Add after `.panel`:

```css
.route-panel {
  min-height: 320px;
}

.route-stack {
  display: grid;
  gap: 18px;
}

.home-grid,
.method-route-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-summary,
.quick-actions {
  min-height: 220px;
}

.summary-grid,
.quick-action-grid {
  display: grid;
  gap: 10px;
}

.summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-item,
.quick-action-grid a {
  background: #f8fafb;
  border: 1px solid #e3eaee;
  border-radius: 6px;
  color: #172026;
  display: grid;
  gap: 4px;
  padding: 12px;
  text-decoration: none;
}

.summary-item span {
  color: #52616a;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.drawing-route {
  max-width: 720px;
}

.method-number-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
}

.method-number {
  min-height: 38px;
}
```

- [ ] **Step 4: Add mobile route styles**

Inside `@media (max-width: 980px)`, add:

```css
  .app-nav {
    align-items: stretch;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-grid,
  .method-route-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 5: Run tests and build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/styles.css
git commit -m "Style route based app layout"
```

---

### Task 5: Browser Verification And Final Commit State

**Files:**
- No new source files expected.
- May modify: `src/styles.css` only if browser verification exposes overlap or unreadable layout.

**Interfaces:**
- Consumes: local app on Vite and local API server
- Produces: verified route-based user experience

- [ ] **Step 1: Start local app**

Run:

```bash
npm run server
npm run dev -- --port 5183
```

Expected:
- API responds on `http://127.0.0.1:5174`.
- Vite responds on `http://127.0.0.1:5183`.

- [ ] **Step 2: Verify direct route loads**

Open these URLs directly:

```text
http://127.0.0.1:5183/
http://127.0.0.1:5183/base-datos
http://127.0.0.1:5183/tiradas
http://127.0.0.1:5183/metodos/digitos
http://127.0.0.1:5183/metodos/normal
http://127.0.0.1:5183/metodos/inverso
http://127.0.0.1:5183/coincidencias
```

Expected:
- Every URL loads the React app.
- The active nav item is visible.
- No route shows rankings or parlet summary tables.

- [ ] **Step 3: Verify workflows**

Manual checks:
- `/base-datos` shows the database table, filter, and Excel upload controls.
- `/tiradas` saves a drawing form layout and has the `Analizar estos numeros` button.
- Enter three manual numbers on `/tiradas`, click `Analizar estos numeros`, then navigate to `/metodos/normal`; the method numbers reflect the manual analysis.
- `/metodos/digitos` shows present and missing digits only.
- `/metodos/normal` shows normal method numbers only.
- `/metodos/inverso` shows inverse method numbers only.
- `/coincidencias` supports `Normal 7` against `Normal 9`.
- `/coincidencias` supports `Normal 7` against `Inverso 9`.
- Clearing either count on `/coincidencias` shows `No hay coincidencias para esos valores.`

- [ ] **Step 4: Verify local server fallback**

Check local server direct routes:

```bash
curl -i http://127.0.0.1:5174/metodos/normal
curl -i http://127.0.0.1:5174/coincidencias
curl -i http://127.0.0.1:5174/api/drawings
curl -i http://127.0.0.1:5174/api/missing
```

Expected:
- `/metodos/normal` and `/coincidencias` return `200` HTML.
- `/api/drawings` returns JSON.
- `/api/missing` returns `404`, not `index.html`.

- [ ] **Step 5: Final tests and build**

Run:

```bash
npm test
npm run build
git status --short --branch
```

Expected:
- `npm test` passes.
- `npm run build` passes.
- `git status --short --branch` shows only expected local artifacts such as `.codex_image_crops/`.

- [ ] **Step 6: Commit any verification fixes**

If Step 3 required CSS fixes, commit them:

```bash
git add src/styles.css
git commit -m "Polish routed app layout"
```

If Step 3 required no fixes, do not create an empty commit.

---

## Final Verification

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Browser verification covers every route.
- [ ] Direct local server route fallback works for client routes.
- [ ] API routes remain API routes.
- [ ] No rankings or parlet summary tables are reintroduced.
- [ ] Summarize changed files, verification, and any remaining untracked local artifacts.

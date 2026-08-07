# Coincidencias de numeros por rangos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una segunda busqueda en `/coincidencias` que filtre parles normales e inversos por listas de conteos y muestre los numeros de dos cifras presentes en ambos grupos con sus apariciones separadas.

**Architecture:** Mantener el calculo como funciones puras en `src/lib/loteria.js`: una analiza las listas de conteos y otra filtra parles, cuenta numeros e intersecta los resultados. `App.jsx` conserva estados editables y aplicados independientes para esta busqueda, mientras `CoincidencesView` presenta la nueva tarjeta debajo de la busqueda exacta existente.

**Tech Stack:** React 18, JavaScript ESM, Node.js test runner, Vite 6, CSS.

## Global Constraints

- Conservar sin cambios la busqueda actual entre dos conteos exactos.
- Aceptar conteos enteros no negativos separados por comas, puntos o espacios.
- Interpretar siempre el punto como separador: `3.5` representa los conteos `3` y `5`.
- Ignorar fragmentos invalidos y consolidar conteos duplicados.
- Contar cada aparicion de `left` o `right` en cada parlet seleccionado.
- Mostrar solo numeros presentes en los grupos Normal e Inverso, con conteos separados.
- Ordenar por apariciones totales descendentes y luego por numero ascendente.
- No modificar Excel, endpoints de API ni reglas existentes de generacion o conteo historico.

---

## File Structure

- Modify: `src/lib/loteria.js` — analizar listas de conteos y calcular coincidencias de numeros por rangos.
- Modify: `src/lib/loteria.test.js` — cubrir parsing, filtrado, conteo, interseccion, orden y estados invalidos.
- Modify: `src/App.jsx` — mantener filtros editables/aplicados, derivar resultados y conectar la vista.
- Modify: `src/views.jsx` — conservar la tarjeta exacta y agregar la tarjeta de busqueda por rangos.
- Modify: `src/styles.css` — presentar controles y filas nuevas de forma responsiva.

---

### Task 1: Logica pura de coincidencias por rangos

**Files:**
- Modify: `src/lib/loteria.test.js:3-15,198`
- Modify: `src/lib/loteria.js:197-261`

**Interfaces:**
- Produces: `parseCountRanges(value: unknown): number[]`
- Produces: `findRangeNumberCoincidences(analysis: { normalParlets?: ParletRow[], inverseParlets?: ParletRow[] } | null, filters?: { normalRanges?: unknown, inverseRanges?: unknown }): RangeNumberCoincidence[]`
- `ParletRow`: `{ left: string, right: string, count: number }`
- `RangeNumberCoincidence`: `{ number: string, normalOccurrences: number, inverseOccurrences: number }`

- [ ] **Step 1: Importar las APIs deseadas y escribir las pruebas fallidas**

Agregar `findRangeNumberCoincidences` y `parseCountRanges` al import de `src/lib/loteria.test.js`, y agregar este bloque al final:

```js
describe('range number coincidences', () => {
  const analysis = {
    normalParlets: [
      { left: '78', right: '15', count: 7 },
      { left: '78', right: '10', count: 6 },
      { left: '21', right: '30', count: 9 },
      { left: '10', right: '21', count: 8 },
      { left: '99', right: '15', count: 2 },
    ],
    inverseParlets: [
      { left: '78', right: '40', count: 5 },
      { left: '15', right: '10', count: 4 },
      { left: '21', right: '78', count: 12 },
      { left: '10', right: '55', count: 4 },
      { left: '21', right: '66', count: 3 },
    ],
  };

  test('parses unique non-negative counts separated by commas, dots, or spaces', () => {
    assert.deepEqual(parseCountRanges('7, 6.8 9,,10...11 7'), [7, 6, 8, 9, 10, 11]);
    assert.deepEqual(parseCountRanges('7, abc, -1, 9'), [7, 9]);
    assert.deepEqual(parseCountRanges('abc, -1'), []);
  });

  test('finds shared numbers and keeps normal and inverse occurrences separate', () => {
    assert.deepEqual(findRangeNumberCoincidences(analysis, {
      normalRanges: '7, 6, 8, 9',
      inverseRanges: '5.4.12',
    }), [
      { number: '10', normalOccurrences: 2, inverseOccurrences: 2 },
      { number: '78', normalOccurrences: 2, inverseOccurrences: 2 },
      { number: '21', normalOccurrences: 2, inverseOccurrences: 1 },
      { number: '15', normalOccurrences: 1, inverseOccurrences: 1 },
    ]);
  });

  test('requires valid ranges on both sides and returns no non-shared numbers', () => {
    assert.deepEqual(findRangeNumberCoincidences(analysis, {
      normalRanges: '',
      inverseRanges: '4',
    }), []);
    assert.deepEqual(findRangeNumberCoincidences(analysis, {
      normalRanges: '2',
      inverseRanges: '3',
    }), []);
    assert.deepEqual(findRangeNumberCoincidences(null, {
      normalRanges: '7',
      inverseRanges: '4',
    }), []);
  });
});
```

- [ ] **Step 2: Ejecutar las pruebas y confirmar RED**

Run:

```powershell
npm test -- src/lib/loteria.test.js
```

Expected: FAIL porque `findRangeNumberCoincidences` y `parseCountRanges` aun no se exportan desde `src/lib/loteria.js`.

- [ ] **Step 3: Implementar el parser y el calculo minimo**

Agregar despues de `parseCountFilter` en `src/lib/loteria.js`:

```js
export function parseCountRanges(value) {
  const counts = String(value ?? '')
    .split(/[,\.\s]+/)
    .filter((part) => /^\d+$/.test(part))
    .map(Number);

  return unique(counts);
}

export function findRangeNumberCoincidences(analysis, filters = {}) {
  const normalRanges = new Set(parseCountRanges(filters.normalRanges));
  const inverseRanges = new Set(parseCountRanges(filters.inverseRanges));

  if (!analysis || normalRanges.size === 0 || inverseRanges.size === 0) {
    return [];
  }

  const normalOccurrences = countNumbersInParlets(
    (analysis.normalParlets || []).filter((row) => normalRanges.has(row.count)),
  );
  const inverseOccurrences = countNumbersInParlets(
    (analysis.inverseParlets || []).filter((row) => inverseRanges.has(row.count)),
  );

  return [...normalOccurrences.entries()]
    .filter(([number]) => inverseOccurrences.has(number))
    .map(([number, count]) => ({
      number,
      normalOccurrences: count,
      inverseOccurrences: inverseOccurrences.get(number),
    }))
    .sort((a, b) => (
      (b.normalOccurrences + b.inverseOccurrences)
      - (a.normalOccurrences + a.inverseOccurrences)
      || a.number.localeCompare(b.number)
    ));
}

function countNumbersInParlets(rows) {
  const occurrences = new Map();

  rows.forEach(({ left, right }) => {
    [left, right].map(normalizeNumber).forEach((number) => {
      occurrences.set(number, (occurrences.get(number) || 0) + 1);
    });
  });

  return occurrences;
}
```

- [ ] **Step 4: Ejecutar la prueba focalizada y confirmar GREEN**

Run:

```powershell
node --test --test-name-pattern="range number coincidences" src/lib/loteria.test.js
```

Expected: 3 tests PASS y ninguna prueba FAIL.

- [ ] **Step 5: Ejecutar toda la suite antes de comprometer**

Run:

```powershell
npm test
```

Expected: todas las pruebas PASS sin errores.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/loteria.js src/lib/loteria.test.js
git commit -m "feat: calculate number coincidences by ranges"
```

---

### Task 2: Estado y flujo independiente en la aplicacion

**Files:**
- Modify: `src/App.jsx:1-32,104-107,157-159,231-240`

**Interfaces:**
- Consumes: `findRangeNumberCoincidences(analysis, rangeFilters)` from Task 1.
- Consumes: `parseCountRanges(value)` from Task 1.
- Produces props for `CoincidencesView`: `rangeFilters`, `rangeMatches`, `rangeSearchReady`, `onSearchRangeMatches`, `setRangeFilters`.

- [ ] **Step 1: Verificar la linea base antes de integrar**

Run:

```powershell
npm test
npm run build
```

Expected: todas las pruebas PASS y Vite termina con `built in`.

- [ ] **Step 2: Importar las funciones y declarar el estado inicial**

Reemplazar el import de loteria y agregar el valor inicial despues de `defaultMatchFilters`:

```js
import {
  findMethodDigitCoincidences,
  findRangeNumberCoincidences,
  parseCountRanges,
} from './lib/loteria.js';

const defaultRangeFilters = {
  normalRanges: '',
  inverseRanges: '',
};
```

Dentro de `App`, despues de los estados de `matchFilters`, agregar estados editables y aplicados separados:

```js
const [rangeFilters, setRangeFilters] = useState(defaultRangeFilters);
const [appliedRangeFilters, setAppliedRangeFilters] = useState(defaultRangeFilters);
```

- [ ] **Step 3: Agregar la accion de busqueda y los valores derivados**

Despues de `searchMatches`, agregar:

```js
function searchRangeMatches(event) {
  event.preventDefault();
  setAppliedRangeFilters(rangeFilters);
}
```

Despues de `filteredMatches`, agregar:

```js
const rangeMatches = useMemo(() => (
  analysis ? findRangeNumberCoincidences(analysis, appliedRangeFilters) : []
), [analysis, appliedRangeFilters]);

const rangeSearchReady = useMemo(() => (
  parseCountRanges(appliedRangeFilters.normalRanges).length > 0
  && parseCountRanges(appliedRangeFilters.inverseRanges).length > 0
), [appliedRangeFilters]);
```

- [ ] **Step 4: Pasar el contrato nuevo a `CoincidencesView`**

Ampliar las props de la ruta `/coincidencias`:

```jsx
<CoincidencesView
  filteredMatches={filteredMatches}
  matchFilters={matchFilters}
  onSearchMatches={searchMatches}
  onSearchRangeMatches={searchRangeMatches}
  rangeFilters={rangeFilters}
  rangeMatches={rangeMatches}
  rangeSearchReady={rangeSearchReady}
  setMatchFilters={setMatchFilters}
  setRangeFilters={setRangeFilters}
/>
```

- [ ] **Step 5: Verificar que la integracion compila**

Run:

```powershell
npm run build
```

Expected: Vite termina con `built in` sin errores de imports, JSX ni propiedades.

- [ ] **Step 6: Commit**

```powershell
git add src/App.jsx
git commit -m "feat: wire range coincidence search state"
```

---

### Task 3: Tarjeta y resultados de coincidencias por rangos

**Files:**
- Modify: `src/views.jsx:156-235`
- Modify: `src/styles.css:341-393,483-493`

**Interfaces:**
- Consumes props from Task 2: `rangeFilters`, `rangeMatches`, `rangeSearchReady`, `onSearchRangeMatches`, `setRangeFilters`.
- Consumes each result as `{ number, normalOccurrences, inverseOccurrences }`.
- Produces two tarjetas independientes dentro de la misma ruta: busqueda exacta y busqueda por rangos.

- [ ] **Step 1: Ampliar el contrato de la vista**

Actualizar la firma de `CoincidencesView`:

```jsx
export function CoincidencesView({
  filteredMatches,
  matchFilters,
  onSearchMatches,
  onSearchRangeMatches,
  rangeFilters,
  rangeMatches,
  rangeSearchReady,
  setMatchFilters,
  setRangeFilters,
}) {
```

- [ ] **Step 2: Conservar la busqueda exacta dentro de su propia tarjeta**

Cambiar el contenedor raiz actual por `route-stack` y usar este bloque como primera tarjeta:

```jsx
return (
  <section className="route-stack">
    <section className="panel route-panel">
      <h2>Coincidencias normal / inverso</h2>
      <form className="match-filter" onSubmit={onSearchMatches}>
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
  </section>
);
```

- [ ] **Step 3: Agregar la tarjeta nueva debajo de la busqueda exacta**

Insertar como segundo hijo de `route-stack`:

```jsx
<section className="panel route-panel">
  <h2>Coincidencias por rangos</h2>
  <form className="range-filter" onSubmit={onSearchRangeMatches}>
    <label>
      Rangos Normal
      <input
        placeholder="7, 6, 8, 9, 10, 11"
        value={rangeFilters.normalRanges}
        onChange={(event) => setRangeFilters({
          ...rangeFilters,
          normalRanges: event.target.value,
        })}
      />
    </label>
    <label>
      Rangos Inverso
      <input
        placeholder="5, 4, 12"
        value={rangeFilters.inverseRanges}
        onChange={(event) => setRangeFilters({
          ...rangeFilters,
          inverseRanges: event.target.value,
        })}
      />
    </label>
    <button type="submit">Buscar numeros repetidos</button>
  </form>

  <div className="range-match-list">
    {!rangeSearchReady && (
      <p className="empty-state">Completa ambos rangos para buscar.</p>
    )}
    {rangeSearchReady && rangeMatches.length === 0 && (
      <p className="empty-state">No hay numeros repetidos entre esos rangos.</p>
    )}
    {rangeMatches.map((match) => (
      <div className="range-match-row" key={match.number}>
        <strong className="range-match-number">{match.number}</strong>
        <span>Normal: <strong>{match.normalOccurrences}</strong> veces</span>
        <span>Inverso: <strong>{match.inverseOccurrences}</strong> veces</span>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Agregar estilos de escritorio y movil**

Agregar junto a `.match-filter` y `.match-list`:

```css
.range-filter {
  align-items: end;
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr auto;
  margin-bottom: 12px;
}

.range-match-list {
  display: grid;
  gap: 8px;
}

.range-match-row {
  align-items: center;
  background: #f8fafb;
  border: 1px solid #e3eaee;
  border-radius: 6px;
  display: grid;
  gap: 12px;
  grid-template-columns: 72px minmax(0, 1fr) minmax(0, 1fr);
  padding: 10px;
}

.range-match-number {
  color: #0f766e;
  font-size: 20px;
}
```

Agregar `.range-filter` al grupo movil que pasa a una columna y agregar la fila movil:

```css
@media (max-width: 700px) {
  .summary-grid,
  .quick-action-grid,
  .number-grid,
  .match-filter,
  .match-field-controls,
  .range-filter {
    grid-template-columns: 1fr;
  }

  .range-match-row {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .range-match-row span:last-child {
    grid-column: 2;
  }
}
```

- [ ] **Step 5: Verificar compilacion y regresiones**

Run:

```powershell
npm test
npm run build
```

Expected: todas las pruebas PASS y Vite termina con `built in`.

- [ ] **Step 6: Verificar manualmente la ruta**

Run:

```powershell
npm start
```

Abrir `http://127.0.0.1:5173/coincidencias` y comprobar:

1. La tarjeta exacta sigue aceptando metodo y conteo en ambos campos.
2. La tarjeta `Coincidencias por rangos` aparece debajo.
3. Antes de aplicar rangos validos muestra `Completa ambos rangos para buscar.`
4. `7, 6, 8, 9, 10, 11` y `5.4.12` se aceptan sin borrar puntos, comas ni espacios.
5. Cada resultado muestra un numero y conteos separados para Normal e Inverso.
6. Cambiar un campo sin pulsar el boton conserva los resultados aplicados.
7. Aplicar rangos validos sin interseccion muestra `No hay numeros repetidos entre esos rangos.`
8. A 700 px o menos, los controles y resultados se apilan sin desbordamiento horizontal.

Detener ambos procesos con `Ctrl+C` al terminar.

- [ ] **Step 7: Commit**

```powershell
git add src/views.jsx src/styles.css
git commit -m "feat: add range coincidence search panel"
```

---

### Task 4: Verificacion final de entrega

**Files:**
- Verify only: `src/lib/loteria.js`, `src/lib/loteria.test.js`, `src/App.jsx`, `src/views.jsx`, `src/styles.css`

**Interfaces:**
- Confirma el flujo completo desde los campos de rangos hasta los resultados renderizados.

- [ ] **Step 1: Ejecutar todas las comprobaciones automatizadas desde cero**

Run:

```powershell
npm test
npm run build
git diff --check HEAD~3..HEAD
```

Expected: todas las pruebas PASS, Vite termina con `built in` y `git diff --check` no imprime errores.

- [ ] **Step 2: Confirmar el alcance de los commits**

Run:

```powershell
git status --short
git log -4 --oneline
git diff --stat HEAD~3..HEAD
```

Expected:

- Los tres commits de implementacion aparecen encima del commit de especificacion.
- El diff contiene solamente los cinco archivos de aplicacion y pruebas previstos.
- `.codex_image_crops/` puede seguir apareciendo como carpeta preexistente sin seguimiento y no debe agregarse.

- [ ] **Step 3: Registrar cualquier correccion de verificacion**

Si una comprobacion exige una correccion, repetir el test que detecto el problema, aplicar el cambio minimo, volver a ejecutar `npm test` y `npm run build`, y crear este commit solamente cuando exista una correccion real:

```powershell
git add src/lib/loteria.js src/lib/loteria.test.js src/App.jsx src/views.jsx src/styles.css
git commit -m "fix: finalize range coincidence search"
```

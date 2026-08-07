import React from 'react';
import { Link } from 'react-router';
import { appRoutes } from './routes.js';
import { DrawingTable, MatchParlet, MethodPanel, NumberInput } from './components.jsx';

export function HomeView({ analysis, drawings, status }) {
  const latest = drawings.at(-1);
  const latestNumbers = latest ? [latest.fijo, latest.first, latest.second].join(' . ') : '--';

  return (
    <section className="route-stack">
      <section className="home-summary">
        <div>
          <p className="eyebrow">Panel principal</p>
          <h2>Loteria Florida</h2>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Tiradas</span>
            <strong>{drawings.length.toLocaleString('es')}</strong>
          </div>
          <div className="summary-item">
            <span>Ultima</span>
            <strong>{latestNumbers}</strong>
          </div>
          <div className="summary-item">
            <span>Digitos</span>
            <strong>{analysis ? analysis.digits.present.join(' . ') : '--'}</strong>
          </div>
          <div className="summary-item">
            <span>Estado</span>
            <strong>{status}</strong>
          </div>
        </div>
      </section>

      <section className="quick-action-grid" aria-label="Rutas principales">
        <Link className="quick-action" to={appRoutes.database}>Base de datos</Link>
        <Link className="quick-action" to={appRoutes.drawings}>Nueva tirada</Link>
        <Link className="quick-action" to={appRoutes.digits}>Digitos</Link>
        <Link className="quick-action" to={appRoutes.normal}>Metodo normal</Link>
        <Link className="quick-action" to={appRoutes.inverse}>Metodo inverso</Link>
        <Link className="quick-action" to={appRoutes.coincidences}>Coincidencias</Link>
      </section>
    </section>
  );
}

export function DatabaseView({
  filter,
  filteredDrawings,
  isLoading,
  onFilterChange,
  onUploadWorkbook,
  setWorkbookFile,
  workbookFile,
}) {
  return (
    <section className="route-grid route-grid-database">
      <form className="panel form-panel" onSubmit={onUploadWorkbook}>
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
            placeholder="Filtrar fecha, turno o numero"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
          />
        </div>
        <DrawingTable drawings={filteredDrawings} />
      </section>
    </section>
  );
}

export function DrawingsView({
  form,
  isLoading,
  recentDrawings,
  onAnalyzeManual,
  onSubmitDrawing,
  setForm,
}) {
  return (
    <section className="route-grid route-grid-drawing">
      <form className="panel form-panel" onSubmit={onSubmitDrawing}>
        <div className="panel-title">
          <h2>Nueva tirada</h2>
          <button type="submit" disabled={isLoading}>Guardar</button>
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
        <button className="secondary" type="button" onClick={onAnalyzeManual}>Analizar estos numeros</button>
      </form>

      <section className="panel">
        <h2>Ultimas tiradas</h2>
        <DrawingTable drawings={recentDrawings} />
      </section>
    </section>
  );
}

export function DigitsView({ analysis }) {
  const items = analysis
    ? [
      `Salieron: ${analysis.digits.present.join(' . ')}`,
      `No salieron: ${analysis.digits.missing.join(' . ')}`,
    ]
    : [];

  return (
    <section className="route-stack">
      <MethodPanel title="Digitos" items={items} />
    </section>
  );
}

export function MethodNumbersView({ items, title }) {
  return (
    <section className="route-stack">
      <MethodPanel title={title} items={items || []} />
    </section>
  );
}

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
    </section>
  );
}

export function NotFoundView() {
  return (
    <section className="panel route-panel">
      <h2>Ruta no encontrada</h2>
      <Link className="quick-action inline-action" to={appRoutes.home}>Volver al inicio</Link>
    </section>
  );
}

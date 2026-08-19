import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import {
  findMethodDigitCoincidences,
  findRangeNumberCoincidences,
  hasEnoughRangeGroups,
} from './lib/loteria.js';
import { withMinimumDelay } from './lib/uiTiming.js';
import { appRoutes, navItems } from './routes.js';
import {
  CoincidencesView,
  DatabaseView,
  DigitsView,
  DrawingsView,
  HomeView,
  MethodNumbersView,
  NotFoundView,
} from './views.jsx';

const defaultMatchFilters = {
  firstMethod: 'normal',
  firstCount: '',
  secondMethod: 'inverse',
  secondCount: '',
};

const defaultRangeFilters = {
  normalRanges: '',
  inverseRanges: '',
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
  const [rangeFilters, setRangeFilters] = useState(defaultRangeFilters);
  const [appliedRangeFilters, setAppliedRangeFilters] = useState(defaultRangeFilters);
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

  function searchRangeMatches(event) {
    event.preventDefault();
    setAppliedRangeFilters(rangeFilters);
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

  const recentDrawings = useMemo(() => drawings.slice(-30).reverse(), [drawings]);

  const filteredMatches = useMemo(() => (
    analysis ? findMethodDigitCoincidences(analysis, appliedMatchFilters) : []
  ), [analysis, appliedMatchFilters]);

  const rangeMatches = useMemo(() => (
    analysis ? findRangeNumberCoincidences(analysis, appliedRangeFilters) : []
  ), [analysis, appliedRangeFilters]);

  const rangeSearchReady = useMemo(
    () => hasEnoughRangeGroups(appliedRangeFilters),
    [appliedRangeFilters],
  );

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

      <nav className="app-nav" aria-label="Rutas principales">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
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
        <Route path={appRoutes.home} element={<HomeView analysis={analysis} drawings={drawings} status={status} />} />
        <Route
          path={appRoutes.database}
          element={(
            <DatabaseView
              filter={filter}
              filteredDrawings={filteredDrawings}
              isLoading={isLoading}
              onFilterChange={setFilter}
              onUploadWorkbook={uploadWorkbook}
              setWorkbookFile={setWorkbookFile}
              workbookFile={workbookFile}
            />
          )}
        />
        <Route
          path={appRoutes.drawings}
          element={(
            <DrawingsView
              form={form}
              isLoading={isLoading}
              onAnalyzeManual={analyzeManual}
              onSubmitDrawing={submitDrawing}
              recentDrawings={recentDrawings}
              setForm={setForm}
            />
          )}
        />
        <Route path={appRoutes.digits} element={<DigitsView analysis={analysis} />} />
        <Route path={appRoutes.normal} element={<MethodNumbersView title="Metodo normal" items={analysis?.normal} />} />
        <Route path={appRoutes.inverse} element={<MethodNumbersView title="Metodo inverso" items={analysis?.inverse} />} />
        <Route
          path={appRoutes.coincidences}
          element={(
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

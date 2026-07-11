import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { withMinimumDelay } from './lib/uiTiming.js';

function App() {
  const [drawings, setDrawings] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Cargando datos...');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
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
        const formData = new FormData();
        formData.append('workbook', workbookFile);

        const response = await fetch('/api/workbook', {
          method: 'POST',
          body: formData,
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

      {error && <div className="alert">{error}</div>}

      <section className="workspace">
        <div className="side-stack">
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

          <form className="panel form-panel" onSubmit={submitDrawing}>
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
        </div>

        <section className="panel database-panel">
          <div className="panel-title">
            <h2>Base de datos</h2>
            <input placeholder="Filtrar fecha, turno o numero" value={filter} onChange={(event) => setFilter(event.target.value)} />
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

      {analysis && (
        <>
          <section className="method-grid">
            <MethodPanel title="Digitos" items={[`Salieron: ${analysis.digits.present.join(' . ')}`, `No salieron: ${analysis.digits.missing.join(' . ')}`]} />
            <MethodPanel title="Metodo normal" items={analysis.normal} />
            <MethodPanel title="Metodo inverso" items={analysis.inverse} />
          </section>

          <section className="workspace">
            <ParletPanel title="Parlets normales" rows={analysis.normalParlets.slice(0, 20)} />
            <ParletPanel title="Parlets inversos" rows={analysis.inverseParlets.slice(0, 20)} />
          </section>

          <section className="workspace">
            <RankingPanel rankings={analysis.rankings} />
            <section className="panel">
              <h2>Coincidencias normal / inverso</h2>
              <div className="match-list">
                {analysis.matches.slice(0, 24).map((match) => (
                  <div className="match-row" key={`${match.normal.join('-')}-${match.inverse.join('-')}`}>
                    <span>{match.normal.join(' . ')}</span>
                    <strong>{match.normalCount}</strong>
                    <span>{match.inverse.join(' . ')}</span>
                    <strong>{match.inverseCount}</strong>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </>
      )}
    </main>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input
        inputMode="numeric"
        maxLength="2"
        placeholder="00"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 2))}
      />
    </label>
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

function MethodPanel({ title, items }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="chips">
        {items.map((item) => <span className="chip" key={item}>{item}</span>)}
      </div>
    </section>
  );
}

function ParletPanel({ title, rows }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="parlet-list">
        {rows.map((row) => (
          <div className="parlet-row" key={`${row.left}-${row.right}`}>
            <span>{row.left} . {row.right}</span>
            <strong>{row.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function RankingPanel({ rankings }) {
  const groups = [
    ['Calientes', rankings.hot],
    ['Frios', rankings.cold],
    ['Salidores', rankings.frequent],
    ['No han salido', rankings.never],
  ];

  return (
    <section className="panel">
      <h2>Rankings</h2>
      <div className="ranking-grid">
        {groups.map(([title, rows]) => (
          <div key={title}>
            <h3>{title}</h3>
            {rows.map((row) => (
              <div className="parlet-row compact" key={`${title}-${row.number}`}>
                <span>{row.number}</span>
                <strong>{row.count}</strong>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);

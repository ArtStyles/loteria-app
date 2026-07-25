import React from 'react';

export function NumberInput({ label, value, onChange }) {
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

export function DrawingTable({ drawings, emptyMessage = 'No hay tiradas para mostrar.' }) {
  return (
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
          {drawings.length === 0 && (
            <tr>
              <td className="table-empty" colSpan={5}>{emptyMessage}</td>
            </tr>
          )}
          {drawings.map((drawing) => (
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
  );
}

export function MethodPanel({ title, items, emptyMessage = 'Sin datos calculados.' }) {
  return (
    <section className="panel method-panel">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="chips">
          {items.map((item) => <span className="chip" key={item}>{item}</span>)}
        </div>
      )}
    </section>
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

export function formatMethodLabel(method) {
  return method === 'inverse' ? 'Inverso' : 'Normal';
}

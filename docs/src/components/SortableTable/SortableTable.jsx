import React, { useState } from 'react';
import ProviderIcon from '../ProviderIcons';

// A table whose column headers sort the rows. Rows with no value in the sort column (for example a model that did not
// finish) always stay at the bottom. Each column: { key, label, numeric?, format?, defaultDir? }.
export default function SortableTable({ columns, rows, defaultSort, note }) {
  const first = columns.find((c) => c.key === defaultSort) || columns[0];
  const [sort, setSort] = useState({ key: first.key, dir: first.defaultDir || 'asc' });

  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const aMissing = av === null || av === undefined;
    const bMissing = bv === null || bv === undefined;
    if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const onSort = (col) =>
    setSort((s) => (s.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: col.defaultDir || 'asc' }));

  return (
    <>
      <table>
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort.key === col.key;
              return (
                <th key={col.key} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => onSort(col)}
                    style={{ all: 'unset', cursor: 'pointer', fontWeight: 'inherit', whiteSpace: 'nowrap' }}
                    title={`Sort by ${col.label}`}
                  >
                    {col.label} <span style={{ opacity: active ? 1 : 0.3 }}>{active && sort.dir === 'desc' ? '▼' : '▲'}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row[columns[0].key]}>
              {columns.map((col, i) => {
                const v = row[col.key];
                const shown = row[`${col.key}Display`];
                const text = v === null || v === undefined ? row.missingText && i === 1 ? row.missingText : '' : shown ?? (col.format ? col.format(v) : v);
                return (
                  <td key={col.key} style={i === 0 ? { whiteSpace: 'nowrap' } : undefined}>
                    {i === 0 ? (
                      <>
                        {row.provider ? <ProviderIcon provider={row.provider} /> : null}
                        <strong>{text}</strong>
                      </>
                    ) : (
                      text
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {note ? <p style={{ fontSize: '0.9em', marginTop: '-0.5rem' }}>{note}</p> : null}
    </>
  );
}

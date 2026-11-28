import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Compact stand-in for a toolbar's filter chips. Both are rendered; a container query in
 * RuntimeInspector/styles.scss shows this one only when the panel is too narrow for the chips.
 * options: [{ value, label, count? }]
 */
const RuntimeFilterSelect = ({ value, options, onChange, ariaLabel, dataCy }) => (
  <label className="runtime-inspector__filter-select">
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel} data-cy={dataCy}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.count === undefined ? option.label : `${option.label} (${option.count})`}
        </option>
      ))}
    </select>
    <ChevronDown size={12} aria-hidden="true" />
  </label>
);

export default RuntimeFilterSelect;

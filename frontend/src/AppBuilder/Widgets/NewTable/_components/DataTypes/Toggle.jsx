import React from 'react';

export const ToggleColumn = ({ value, readOnly, activeColor, onChange }) => {
  return (
    <div className="h-100 d-flex align-items-center">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => !readOnly && onChange(e.target.checked)}
          disabled={readOnly}
        />
        <span className="toggle-slider" style={{ backgroundColor: value ? activeColor : undefined }} />
      </label>
    </div>
  );
};

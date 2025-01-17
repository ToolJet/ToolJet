import React from 'react';

export const BooleanColumn = ({ value, isEditable, onChange, toggleOnBg, toggleOffBg }) => {
  return (
    <div className="h-100 d-flex align-items-center">
      <input
        type="checkbox"
        checked={!!value}
        disabled={!isEditable}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          backgroundColor: value ? toggleOnBg : toggleOffBg,
        }}
      />
    </div>
  );
};

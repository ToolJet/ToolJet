import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

export const Color = ({
  param, definition, onChange, paramType
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px'
  };

  return (
    <div className="field mb-2">
      <label className="form-label">{param.name}</label>

      {showPicker && (
        <div>
          <div style={coverStyles} onClick={() => setShowPicker(false)} />
          <SketchPicker
            onFocus={() => setShowPicker(true)}
            color={definition.value}
            onChangeComplete={(color) => onChange(param, 'value', color.hex, paramType)}
          />
        </div>
      )}

      <input
        onFocus={() => setShowPicker(true)}
        type="text"
        onChange={(e) => onChange(param, 'value', e.target.value, paramType)}
        className="form-control text-field"
        name=""
        value={definition.value}
      />
    </div>
  );
};

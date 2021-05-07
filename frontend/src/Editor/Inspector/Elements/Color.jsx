import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import { getToolTipProps } from './utils';

export const Color = ({
  param, definition, onChange, paramType, componentMeta
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px'
  };

  const paramMeta = componentMeta[paramType][param.name] || {};
  const displayName = paramMeta.displayName || param.name;

  return (
    <div className="field mb-2">
      <label {...getToolTipProps(paramMeta)} className="form-label">{displayName}</label>

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

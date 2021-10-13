import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import { ToolTip } from './Components/ToolTip';

export const Color = ({ param, definition, onChange, paramType, componentMeta }) => {
  const [showPicker, setShowPicker] = useState(false);

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };

  const paramMeta = componentMeta[paramType][param.name] || {};
  const displayName = paramMeta.displayName || param.name;

  return (
    <div className="field mb-3">
      <ToolTip label={displayName} meta={paramMeta} />

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

      <div className="row mx-0 form-control color-picker-input" onClick={() => setShowPicker(true)}>
        <div
          className="col-auto"
          style={{ float: 'right', width: '20px', height: '20px', backgroundColor: definition.value, border: `0.25px solid ${
              (definition.value === '#ffffff' || definition.value === '#fff' || definition.value === '#1F2936') &&
              '#d9dcde'
            }`
          }}
        ></div>
        <div className="col">{definition.value}</div>
      </div>
    </div>
  );
};

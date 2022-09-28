import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import { ToolTip } from './Components/ToolTip';

export const Color = ({ param, definition, onChange, paramType, componentMeta, cyLabel }) => {
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

  const decimalToHex = (alpha) => {
    let aHex = Math.round(255 * alpha).toString(16);
    return alpha === 0 ? '00' : aHex.length < 2 ? `0${aHex}` : aHex;
  };
  const handleColorChange = (color) => {
    const hexCode = `${color.hex}${decimalToHex(color?.rgb?.a ?? 1.0)}`;
    onChange(param, 'value', hexCode, paramType);
  };

  return (
    <div className="field mb-3">
      <ToolTip label={displayName} meta={paramMeta} />

      {showPicker && (
        <div>
          <div style={coverStyles} onClick={() => setShowPicker(false)} />
          <SketchPicker
            onFocus={() => setShowPicker(true)}
            color={definition.value}
            onChangeComplete={handleColorChange}
          />
        </div>
      )}

      <div
        className="row mx-0 form-control color-picker-input"
        onClick={() => setShowPicker(true)}
        data-cy={`${String(cyLabel)}-picker`}
      >
        <div
          className="col-auto"
          style={{
            float: 'right',
            width: '20px',
            height: '20px',
            backgroundColor: definition.value,
            border: `0.25px solid ${['#ffffff', '#fff', '#1f2936'].includes(definition.value) && '#c5c8c9'}`,
          }}
        ></div>
        <div style={{ height: '20px' }} className="col">
          {definition.value}
        </div>
      </div>
    </div>
  );
};

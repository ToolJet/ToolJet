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
  const outerStyles = {
    width: '142px',
    height: '32px',
    borderRadius: ' 6px',
    display: 'flex',
    paddingLeft: '4px',
    alignItems: 'center',
    gap: '4px',
    background: showPicker && 'var(--indigo2)',
    outline: showPicker && '1px solid var(--indigo9)',
    boxShadow: showPicker && '0px 0px 0px 1px #C6D4F9',
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
        className="row mx-0 color-picker-input"
        onClick={() => setShowPicker(true)}
        data-cy={`${String(cyLabel)}-picker`}
        style={outerStyles}
      >
        <div
          className="col-auto"
          style={{
            float: 'right',
            width: '24px',
            height: '24px',
            backgroundColor: definition.value,
            borderRadius: ' 6px',
            border: `1px solid var(--slate7, #D7DBDF)`,
            boxShadow: `0px 1px 2px 0px rgba(16, 24, 40, 0.05)`,
          }}
        ></div>
        <div style={{ height: '20px' }} className="col">
          {definition.value}
        </div>
      </div>
    </div>
  );
};

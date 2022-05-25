import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import FxButton from './FxButton';

export const Color = ({ value, onChange, forceCodeBox }) => {
  const [showPicker, setShowPicker] = useState(false);

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };

  const decimalToHex = (alpha) => {
    let aHex = Math.round(255 * alpha).toString(16);
    return alpha === 0 ? '00' : aHex.length < 2 ? `0${aHex}` : aHex;
  };
  const handleColorChange = (color) => {
    const hexCode = `${color.hex}${decimalToHex(color?.rgb?.a ?? 1.0)}`;
    onChange(hexCode);
  };

  return (
    <div className="row fx-container">
      <div className="col">
        <div className="field mb-2">
          {showPicker && (
            <div>
              <div style={coverStyles} onClick={() => setShowPicker(false)} />
              <SketchPicker onFocus={() => setShowPicker(true)} color={value} onChangeComplete={handleColorChange} />
            </div>
          )}

          <div
            className="row mx-0 form-control color-picker-input"
            onClick={() => setShowPicker(true)}
            data-cy="color-picker-input"
          >
            <div
              className="col-auto"
              style={{
                float: 'right',
                width: '20px',
                height: '20px',
                backgroundColor: value,
                border: `0.25px solid ${['#ffffff', '#fff', '#1f2936'].includes(value) && '#c5c8c9'}`,
              }}
            ></div>
            <div className="col">{value}</div>
          </div>
        </div>
      </div>
      <div className="col-auto pt-2 style-fx fx-common">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};

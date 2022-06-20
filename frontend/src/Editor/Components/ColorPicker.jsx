import React, { useState, useEffect } from 'react';
import { SketchPicker } from 'react-color';

export const ColorPicker = function ({ width, properties, styles, setExposedVariable, darkMode, height }) {
  const { visibility } = styles;
  const defaultColor = properties.defaultColor;
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [color, setColor] = useState(defaultColor);
  useEffect(() => setColor(defaultColor), [defaultColor]);

  const handleColorChange = (color) => {
    const { r, g, b, a } = color.rgb;
    const { hex: hexColor } = color;
    setColor(hexColor);
    setExposedVariable('selectedColorHex', `${hexColor}`);
    setExposedVariable('selectedColorRGB', `rgb(${r},${g},${b})`);
    setExposedVariable('selectedColorRGBA', `rgb(${r},${g},${b},${a})`);
  };
  //background color style for the div dispaying box filled by selected color
  const backgroundColorDivStyle = {
    background: color,
    width: '20px',
    height: '20px',
    border: `0.25px solid ${['#ffffff', '#fff', '#1f2936'].includes(color) && '#c5c8c9'}`,
  };

  const style = {
    borderRadius: '5px',
    height,
    padding: '0.5rem',
    border: `1px solid ${['#ffffff', '#fff', '#1f2936'].includes(color) && '#c5c8c9'}`,
    positin: 'relative',
  };
  const baseStyle = visibility
    ? darkMode
      ? { ...style, color: '#ffffff', backgroundColor: '#1F2936' }
      : { ...style, color: 'inherit' }
    : { display: 'none' };

  return (
    <div style={baseStyle} className="form-control">
      <div className="d-flex h-100 justify-content-between align-items-center" onClick={() => setShowColorPicker(true)}>
        <span>{color}</span>
        <div style={backgroundColorDivStyle}></div>
      </div>
      {showColorPicker && (
        <>
          <div
            className="position-absolute bottom-0"
            style={{ left: 0, right: 0 }}
            onMouseLeave={() => setShowColorPicker(false)}
            width={width}
          >
            <SketchPicker color={color} onChangeComplete={handleColorChange} />
          </div>
          <div className="color-picker-overlay" onClick={() => setShowColorPicker(false)}></div>
        </>
      )}
    </div>
  );
};

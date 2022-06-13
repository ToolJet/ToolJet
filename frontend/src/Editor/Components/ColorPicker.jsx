import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

export const ColorPicker = function ({ width, properties, styles, setExposedVariable }) {
  const { visibility } = styles;
  const defaultColor = properties.defaultColor;
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [color, setColor] = useState(defaultColor);

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
  //color style for text showing selected color
  const textColorStyle = { color: 'black' };
  const baseStyle = {
    width,
    display: visibility ? 'block' : 'none',
  };

  return (
    <div style={baseStyle}>
      <div
        className="d-flex h-100 justify-content-between align-items-center px-2 py-1"
        onClick={() => setShowColorPicker(true)}
      >
        <span style={textColorStyle}>{color}</span>
        <div style={backgroundColorDivStyle}></div>
      </div>
      {showColorPicker && (
        <div className="w-100" onMouseLeave={() => setShowColorPicker(false)}>
          <SketchPicker color={color} onChangeComplete={handleColorChange} />
        </div>
      )}
    </div>
  );
};

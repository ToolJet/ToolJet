import React, { useState, useEffect, useRef } from 'react';
import { SketchPicker } from 'react-color';
import { hexToRgba, hexToRgb } from '@/_helpers/appUtils';

export const ColorPicker = function ({
  width,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  height,
  fireEvent,
  dataCy,
  id,
}) {
  const { visibility, boxShadow } = styles;
  const defaultColor = properties.defaultColor;
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [color, setColor] = useState(defaultColor);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    const element = document.querySelector(`.ele-${id}`);
    if (element) {
      element.style.zIndex = showColorPicker ? '3' : '';
    }
  }, [showColorPicker, id]);

  useEffect(() => {
    let exposedVariables = {};
    setExposedVariable('setColor', async function (colorCode) {
      if (/^#(([\dA-Fa-f]{3}){1,2}|([\dA-Fa-f]{4}){1,2})$/.test(colorCode)) {
        if (colorCode !== color) {
          setColor(colorCode);
          exposedVariables = {
            selectedColorHex: colorCode,
            selectedColorRGB: hexToRgb(colorCode),
            selectedColorRGBA: hexToRgba(colorCode),
          };
          setExposedVariables(exposedVariables);

          fireEvent('onChange');
        }
      } else {
        exposedVariables = {
          selectedColorHex: undefined,
          selectedColorRGB: undefined,
          selectedColorRGBA: undefined,
        };
        setExposedVariables(exposedVariables);

        fireEvent('onChange');
        setColor('Invalid Color');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let exposedVariables = {};
    if (/^#(([\dA-Fa-f]{3}){1,2}|([\dA-Fa-f]{4}){1,2})$/.test(defaultColor)) {
      exposedVariables = {
        selectedColorHex: defaultColor,
        selectedColorRGB: hexToRgb(defaultColor),
        selectedColorRGBA: hexToRgba(defaultColor),
      };
      setExposedVariables(exposedVariables);

      setColor(defaultColor);
    } else {
      exposedVariables = {
        selectedColorHex: undefined,
        selectedColorRGB: undefined,
        selectedColorRGBA: undefined,
      };
      setExposedVariables(exposedVariables);

      setColor(`Invalid Color`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultColor]);

  useEffect(() => {
    if (showColorPicker) {
      const handleClickOutside = (event) => {
        if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
          setShowColorPicker(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showColorPicker]);

  const handleColorChange = (colorCode) => {
    let exposedVariables = {};
    const { r, g, b, a } = colorCode.rgb;
    const { hex: hexColor } = colorCode;
    if (hexColor !== color) {
      setColor(hexColor);
      exposedVariables = {
        selectedColorHex: hexColor,
        selectedColorRGB: `rgb(${r},${g},${b})`,
        selectedColorRGBA: `rgb(${r},${g},${b},${a})`,
      };
      setExposedVariables(exposedVariables);
      fireEvent('onChange');
    }
  };
  //background color style for the div dispaying box filled by selected color
  const backgroundColorDivStyle = {
    background: `${color}`,
    width: '20px',
    height: '20px',
    border: `0.25px solid ${['#ffffff', '#fff', '#1f2936'].includes(color) && '#c5c8c9'}`,
  };

  const style = {
    borderRadius: '5px',
    height,
    padding: '0.5rem',
    border: `1px solid ${['#ffffff', '#fff', '#ffff', '#1f2936'].includes(color) && '#c5c8c9'}`,
    positin: 'relative',
  };
  const baseStyle = visibility
    ? { ...style, color: 'var(--cc-primary-text)', backgroundColor: 'var(--cc-surface1-surface)' }
    : { display: 'none' };

  return (
    <div className="h-100">
      <div
        style={{
          ...baseStyle,
          boxShadow,
          height: '100%',
          border: `1px solid ${showColorPicker ? 'var(--cc-primary-brand)' : 'var(--cc-default-border)'}`,
        }}
        className="form-control"
        data-cy={dataCy}
      >
        <div
          className="d-flex h-100 justify-content-between align-items-center"
          onClick={() => setShowColorPicker(true)}
        >
          <span>{color}</span>
          {!(color === `Invalid Color`) && <div style={backgroundColorDivStyle}></div>}
        </div>
      </div>
      {showColorPicker && (
        <div className="position-relative top-0 mt-1" ref={colorPickerRef} width={width}>
          <SketchPicker color={color} onChangeComplete={handleColorChange} />
        </div>
      )}
    </div>
  );
};

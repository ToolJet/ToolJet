import React, { useRef, useState, useEffect } from 'react';

export const NumberInput = function NumberInput({
  height,
  properties,
  styles,
  setExposedVariable,
  darkMode,
  fireEvent,
  dataCy,
}) {
  const { visibility, borderRadius, borderColor, backgroundColor } = styles;

  const textColor = darkMode && ['#232e3c', '#000000ff'].includes(styles.textColor) ? '#fff' : styles.textColor;

  const [value, setValue] = React.useState(parseFloat(properties.value).toFixed(properties.decimalPlaces));
  const inputRef = useRef(null);
  const [isClickedOutside, setIsClickedOutside] = useState(false);

  useEffect(() => {
    setValue(parseFloat(value).toFixed(properties.decimalPlaces));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClickedOutside, properties.decimalPlaces]);

  useEffect(() => {
    setValue(parseFloat(properties.value).toFixed(properties.decimalPlaces));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsClickedOutside(true);
      } else {
        setIsClickedOutside(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    if (
      !isNaN(parseFloat(properties.minValue)) &&
      !isNaN(parseFloat(properties.maxValue)) &&
      parseFloat(properties.minValue) > parseFloat(properties.maxValue)
    ) {
      setValue(parseFloat(properties.maxValue));
    } else if (
      !isNaN(parseFloat(properties.maxValue)) &&
      parseFloat(e.target.value) > parseFloat(properties.maxValue)
    ) {
      setValue(parseFloat(properties.maxValue));
    } else if (
      !isNaN(parseFloat(properties.minValue)) &&
      parseFloat(e.target.value) < parseFloat(properties.minValue)
    ) {
      setValue(parseFloat(properties.minValue));
    } else {
      setValue(parseFloat(e.target.value));
    }
    fireEvent('onChange');
  };

  useEffect(() => {
    if (!isNaN(value)) {
      setExposedVariable('value', value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const computedStyles = {
    height,
    display: visibility ? '' : 'none',
    borderRadius: `${borderRadius}px`,
    borderColor,
    color: textColor,
    backgroundColor: darkMode && ['#ffffff', '#ffffffff'].includes(backgroundColor) ? '#000000' : backgroundColor,
  };

  return (
    <>
      {!properties.loadingState && (
        <input
          ref={inputRef}
          disabled={styles.disabledState}
          onChange={handleChange}
          type="number"
          className="form-control"
          placeholder={properties.placeholder}
          style={computedStyles}
          value={value}
          data-cy={dataCy}
        />
      )}
      {properties.loadingState === true && (
        <div style={{ width: '100%' }}>
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      )}
    </>
  );
};

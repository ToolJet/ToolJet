import React, { useEffect } from 'react';

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

  const [value, setValue] = React.useState(parseInt(properties.value).toFixed(properties.decimalPlaces));

  useEffect(() => {
    setValue(parseInt(properties.value).toFixed(properties.decimalPlaces));
  }, [properties.decimalPlaces, properties.value]);

  const handleChange = (e) => {
    if (
      !isNaN(parseInt(properties.minValue)) &&
      !isNaN(parseInt(properties.maxValue)) &&
      parseInt(properties.minValue) > parseInt(properties.maxValue)
    ) {
      setValue(parseInt(properties.maxValue).toFixed(properties.decimalPlaces));
    } else if (!isNaN(parseInt(properties.maxValue)) && parseInt(e.target.value) > parseInt(properties.maxValue)) {
      setValue(parseInt(properties.maxValue).toFixed(properties.decimalPlaces));
    } else if (!isNaN(parseInt(properties.minValue)) && parseInt(e.target.value) < parseInt(properties.minValue)) {
      setValue(parseInt(properties.minValue).toFixed(properties.decimalPlaces));
    } else {
      setValue(parseInt(e.target.value).toFixed(properties.decimalPlaces));
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

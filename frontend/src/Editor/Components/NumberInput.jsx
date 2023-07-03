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

  const [value, setValue] = React.useState(parseInt(properties.value));

  const handleValueChange = (newValue) => {
    if (
      !isNaN(parseInt(properties.minValue)) &&
      !isNaN(parseInt(properties.maxValue)) &&
      parseInt(properties.minValue) > parseInt(properties.maxValue)
    ) {
      setValue(parseInt(properties.maxValue));
    } else if (!isNaN(parseInt(properties.maxValue)) && parseInt(newValue) > parseInt(properties.maxValue)) {
      setValue(parseInt(properties.maxValue));
    } else if (!isNaN(parseInt(properties.minValue)) && parseInt(newValue) < parseInt(properties.minValue)) {
      setValue(parseInt(properties.minValue));
    } else {
      setValue(parseInt(newValue));
    }
  };

  const handleChange = (e) => {
    handleValueChange(e.target.value);
    fireEvent('onChange');
  };

  useEffect(() => {
    handleValueChange(properties.value);
  }, [properties.minValue, properties.maxValue]);

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
  );
};

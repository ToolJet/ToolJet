import React, { useEffect } from 'react';

export const NumberInput = function NumberInput({ height, properties, styles, setExposedVariable }) {
  const { visibility, borderRadius } = styles;

  const [value, setValue] = React.useState(parseInt(properties.value));

  const handleChange = (e) => {
    if (
      !isNaN(parseInt(properties.minValue)) &&
      !isNaN(parseInt(properties.maxValue)) &&
      parseInt(properties.minValue) > parseInt(properties.maxValue)
    ) {
      setValue(parseInt(properties.maxValue));
    } else if (!isNaN(parseInt(properties.maxValue)) && parseInt(e.target.value) > parseInt(properties.maxValue)) {
      setValue(parseInt(properties.maxValue));
    } else if (!isNaN(parseInt(properties.minValue)) && parseInt(e.target.value) < parseInt(properties.minValue)) {
      setValue(parseInt(properties.minValue));
    } else {
      setValue(parseInt(e.target.value));
    }
  };

  useEffect(() => {
    setValue(parseInt(properties.value));
  }, [properties.value]);

  useEffect(() => {
    if (!isNaN(value)) {
      setExposedVariable('value', value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      disabled={styles.disabledState}
      onChange={handleChange}
      type="number"
      className="form-control"
      placeholder={properties.placeholder}
      style={{ height, display: visibility ? '' : 'none', borderRadius: `${borderRadius}px` }}
      value={value}
    />
  );
};

import React, { useEffect } from 'react';

export const NumberInput = function NumberInput({ height, properties, exposedVariables, styles, setExposedVariable }) {
  useEffect(() => {
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  return (
    <input
      disabled={styles.disabledState}
      onChange={(e) => {
        if (
          !isNaN(parseInt(properties.minValue)) &&
          !isNaN(parseInt(properties.maxValue)) &&
          parseInt(properties.minValue) > parseInt(properties.maxValue)
        ) {
          setExposedVariable('value', parseInt(properties.maxValue));
        } else if (!isNaN(parseInt(properties.maxValue)) && parseInt(e.target.value) > parseInt(properties.maxValue)) {
          setExposedVariable('value', parseInt(properties.maxValue));
        } else if (!isNaN(parseInt(properties.minValue)) && parseInt(e.target.value) < parseInt(properties.minValue)) {
          setExposedVariable('value', parseInt(properties.minValue));
        } else {
          setExposedVariable('value', parseInt(e.target.value));
        }
      }}
      type="number"
      className="form-control rounded-0"
      placeholder={properties.placeholder}
      style={{ height, display: styles.visibility ? '' : 'none' }}
      value={exposedVariables.value}
    />
  );
};

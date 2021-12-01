import React from 'react';

export const NumberInput = function NumberInput({ height, properties, exposedVariables, styles, setExposedVariable }) {
  return (
    <input
      disabled={styles.disabledState}
      onChange={(e) => {
        setExposedVariable('value', parseInt(e.target.value));
      }}
      type="number"
      className="form-control rounded-0"
      placeholder={properties.placeholder}
      style={{ height, display: styles.visibility ? '' : 'none' }}
      value={exposedVariables.value}
    />
  );
};

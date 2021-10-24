import React, { useEffect } from 'react';

export const TextArea = function TextArea({ width, height, properties, exposedVariables, styles, setExposedVariable }) {
  useEffect(() => {
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  return (
    <textarea
      disabled={styles.disabledState}
      onChange={(e) => {
        setExposedVariable('value', e.target.value);
      }}
      type="text"
      className="form-control"
      placeholder={properties.placeholder}
      style={{ width, height, resize:'none', display: styles.visibility ? '' : 'none' }}
      value={exposedVariables.value}
    ></textarea>
  );
};

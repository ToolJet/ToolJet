import React, { useEffect } from 'react';

export const TextArea = function TextArea({ width, height, properties, variables, styles, setVariable }) {
  useEffect(() => {
    setVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  return (
    <textarea
      disabled={styles.disabledState}
      onChange={(e) => {
        setVariable('value', e.target.value);
      }}
      type="text"
      className="form-control"
      placeholder={properties.placeholder}
      style={{ width, height, display: styles.visibility ? '' : 'none' }}
      value={variables.value}
    ></textarea>
  );
};

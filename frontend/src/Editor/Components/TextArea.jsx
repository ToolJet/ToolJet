import React from 'react';

export const TextArea = function TextArea({ width, height, properties, styles, setProperty }) {
  return (
    <textarea
      disabled={styles.disabledState}
      onChange={(e) => {
        setProperty('value', e.target.value);
      }}
      type="text"
      className="form-control"
      placeholder={properties.placeholder}
      style={{ width, height, display: styles.visibility ? '' : 'none' }}
      value={properties.value}
    ></textarea>
  );
};

import React, { useState, useEffect } from 'react';

export const TextArea = function TextArea({
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  dataCy,
}) {
  const [value, setValue] = useState(properties.value);

  useEffect(() => {
    setValue(properties.value);
    const exposedVariables = {
      value: properties.value,
      setText: async function (text) {
        setValue(text);
        setExposedVariable('value', text);
      },
      clear: async function (text) {
        setValue(text);
        setExposedVariable('value', text);
      },
    };
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value, setValue]);

  return (
    <textarea
      disabled={styles.disabledState}
      onChange={(e) => {
        setValue(e.target.value);
        setExposedVariable('value', e.target.value);
      }}
      type="text"
      className="form-control textarea"
      placeholder={properties.placeholder}
      style={{
        height,
        resize: 'none',
        display: styles.visibility ? '' : 'none',
        borderRadius: `${styles.borderRadius}px`,
        boxShadow: styles.boxShadow,
      }}
      value={value}
      data-cy={dataCy}
    ></textarea>
  );
};

import React, { useState, useEffect, useRef } from 'react';

export const TextArea = function TextArea({
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  dataCy,
}) {
  const isInitialRender = useRef(true);
  const [value, setValue] = useState(properties.value);

  useEffect(() => {
    if (isInitialRender.current) return;
    setValue(properties.value);
    setExposedVariable('value', properties.value);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  useEffect(() => {
    const exposedVariables = {
      setText: async function (text) {
        setValue(text);
        setExposedVariable('value', text);
      },
      clear: async function () {
        setValue('');
        setExposedVariable('value', '');
      },
      value: properties.value,
    };
    setExposedVariables(exposedVariables);
    setValue(properties.value);
    isInitialRender.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

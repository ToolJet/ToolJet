import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

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
        setValue('');
        setExposedVariable('value', '');
      },
    };
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value, setValue]);

  const debouncedOnChange = useCallback(
    debounce((value) => {
      setExposedVariable('value', value);
    }, 0),
    []
  );

  const onChange = (e) => {
    setValue(e.target.value);
    debouncedOnChange(e.target.value);
  };

  return (
    <textarea
      disabled={styles.disabledState}
      onChange={onChange}
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

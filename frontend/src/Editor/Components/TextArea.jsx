import React, { useState, useEffect } from 'react';

export const TextArea = function TextArea({
  height,
  properties,
  styles,
  setExposedVariable,
  registerAction,
  dataCy,
  boxShadow,
}) {
  const [value, setValue] = useState(properties.value);
  useEffect(() => {
    setValue(properties.value);
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  registerAction(
    'setText',
    async function (text) {
      setValue(text);
      setExposedVariable('value', text);
    },
    [setValue]
  );
  registerAction(
    'clear',
    async function () {
      setValue('');
      setExposedVariable('value', '');
    },
    [setValue]
  );
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
        boxShadow,
      }}
      value={value}
      data-cy={dataCy}
    ></textarea>
  );
};

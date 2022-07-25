import React, { useEffect } from 'react';

export const TextArea = function TextArea({
  height,
  properties,
  exposedVariables,
  styles,
  setExposedVariable,
  registerAction,
}) {
  useEffect(() => {
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  registerAction('setText', async function (text) {
    setExposedVariable('value', text);
  });
  registerAction('clear', async function () {
    setExposedVariable('value', '');
  });
  return (
    <textarea
      disabled={styles.disabledState}
      onChange={(e) => {
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
      }}
      value={exposedVariables.value}
    ></textarea>
  );
};

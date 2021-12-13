import React, { useEffect } from 'react';

export const TextInput = function TextInput({
  height,
  validate,
  properties,
  exposedVariables,
  styles,
  setExposedVariable,
}) {
  useEffect(() => {
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  const validationData = validate(exposedVariables.value);
  const { isValid, validationError } = validationData;

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  return (
    <div>
      <input
        disabled={styles.disabledState}
        onChange={(e) => {
          setExposedVariable('value', e.target.value);
        }}
        type="text"
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon`}
        placeholder={properties.placeholder}
        style={{ height, display: styles.visibility ? '' : 'none' }}
        value={exposedVariables.value}
      />
      <div className="invalid-feedback">{validationError}</div>
    </div>
  );
};

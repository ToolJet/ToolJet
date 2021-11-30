import React, { useEffect } from 'react';

export const TextInput = function TextInput({
  height,
  component,
  currentState,
  validate,
  properties,
  exposedVariables,
  styles,
  setExposedVariable,
}) {
  const value = currentState?.components[component?.name]?.value;
  const currentValidState = currentState?.components[component?.name]?.isValid;

  const validationData = validate(value);

  const { isValid, validationError } = validationData;

  if (currentValidState !== isValid) {
    setExposedVariable('isValid', isValid);
  }

  useEffect(() => {
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

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

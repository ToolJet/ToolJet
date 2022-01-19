import React, { useEffect, useState } from 'react';

export const TextInput = function TextInput({ height, validate, properties, styles, setExposedVariable, fireEvent }) {
  const inputValue = typeof properties.value === 'boolean' ? properties.value.toString() : properties.value;
  // const [value, setValue] = useState(() =>
  //   typeof properties.value === 'boolean' ? properties.value.toString() : properties.value
  // );
  const { isValid, validationError } = validate(inputValue);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  // useEffect(() => {
  //   setValue(properties.value);
  //   setExposedVariable('value', properties.value);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [properties.value]);

  return (
    <div className="text-input">
      <input
        disabled={styles.disabledState}
        onChange={(e) => {
          // setValue(e.target.value);
          setExposedVariable('value', e.target.value);
          fireEvent('onChange');
        }}
        type="text"
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon`}
        placeholder={properties.placeholder}
        style={{ height, display: styles.visibility ? '' : 'none' }}
        value={inputValue}
      />
      <div className="invalid-feedback">{validationError}</div>
    </div>
  );
};

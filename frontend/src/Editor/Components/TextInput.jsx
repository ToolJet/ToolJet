import React, { useEffect, useState } from 'react';

export const TextInput = function TextInput({ height, validate, properties, styles, setExposedVariable, fireEvent }) {
  const [value, setValue] = useState(properties.value);
  const { isValid, validationError } = validate(value);

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    setValue(properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);
  useEffect(() => {
    setExposedVariable('value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <input
        disabled={styles.disabledState}
        onChange={(e) => {
          setValue(e.target.value);
          fireEvent('onChange');
        }}
        type="text"
        className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon`}
        placeholder={properties.placeholder}
        style={{ height, display: styles.visibility ? '' : 'none' }}
        value={value}
      />
      <div className="invalid-feedback">{validationError}</div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';

/**
 * TextFieldAdapter - KeyValuePair adapter for multiline text
 *
 * For KeyValuePair, we use a textarea when editable.
 */
export const TextField = ({
  value = '',
  isEditable = false,
  onChange,
  onBlur,
  autoFocus = false,
  textColor,
  horizontalAlignment = 'left',
  darkMode: _darkMode = false,
  isValid = true,
  validationError,
  accentColor,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = (e) => {
    if (localValue !== value) {
      onChange?.(localValue);
    }
    onBlur?.(e);
  };

  // Editable: render textarea
  if (isEditable) {
    return (
      <div className="kv-text-field">
        <textarea
          value={localValue ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          rows={3}
          className={`kv-input kv-textarea ${!isValid ? 'is-invalid' : ''}`}
          style={{
            textAlign: horizontalAlignment,
            '--accent-color': accentColor,
          }}
        />
        {!isValid && validationError && <div className="invalid-feedback">{validationError}</div>}
      </div>
    );
  }

  // Read-only: render multiline text
  return (
    <div
      style={{
        color: textColor,
        textAlign: horizontalAlignment,
        whiteSpace: 'pre-wrap',
      }}
    >
      {String(value ?? '')}
    </div>
  );
};

export default TextField;

import React, { useState, useEffect } from 'react';

/**
 * NumberFieldAdapter - KeyValuePair adapter for number input
 *
 * For KeyValuePair, we use a simple input element when editable.
 */
export const NumberField = ({
  value,
  isEditable = false,
  onChange,
  onBlur,
  autoFocus = false,
  textColor,
  horizontalAlignment = 'left',
  darkMode: _darkMode = false,
  decimalPlaces = null,
  isValid = true,
  validationError,
  accentColor,
}) => {
  const [localValue, setLocalValue] = useState(value ?? '');

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = (e) => {
    if (localValue === '') {
      onChange?.(null);
    } else {
      const numValue = Number(localValue);
      if (!isNaN(numValue) && numValue !== value) {
        onChange?.(numValue);
      }
    }
    onBlur?.(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  // Calculate step for decimal places
  const step = decimalPlaces !== null && decimalPlaces > 0 ? `0.${'0'.repeat(decimalPlaces - 1)}1` : '1';

  // Editable: render input element
  if (isEditable) {
    return (
      <div className="kv-number-field">
        <input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          step={step}
          className={`kv-input ${!isValid ? 'is-invalid' : ''}`}
          style={{
            textAlign: horizontalAlignment,
            '--accent-color': accentColor,
          }}
        />
        {!isValid && validationError && <div className="invalid-feedback">{validationError}</div>}
      </div>
    );
  }

  // Read-only: render plain text
  const displayValue = value != null ? String(value) : '';
  return (
    <span
      style={{
        color: textColor,
        textAlign: horizontalAlignment,
      }}
    >
      {displayValue}
    </span>
  );
};

export default NumberField;

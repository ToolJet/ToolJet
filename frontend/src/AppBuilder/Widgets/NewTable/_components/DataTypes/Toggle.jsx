import React, { useState, useCallback, useEffect } from 'react';

export const ToggleColumn = ({ value, readOnly, onChange, activeColor }) => {
  const [isOn, setIsOn] = useState(() => value);

  // Sync internal state with external value
  useEffect(() => {
    setIsOn(value);
  }, [value]);

  const handleToggle = useCallback(() => {
    if (!readOnly) {
      const newValue = !isOn;
      setIsOn(newValue);
      onChange(newValue);
    }
  }, [isOn, readOnly, onChange]);

  return (
    <div className="h-100 d-flex align-items-center">
      <label className="form-check form-switch form-check-inline m-0">
        <input
          className="form-check-input"
          type="checkbox"
          checked={isOn}
          style={isOn && activeColor ? { backgroundColor: activeColor } : {}}
          onChange={handleToggle}
          disabled={readOnly}
          role="switch"
          aria-checked={isOn}
        />
      </label>
    </div>
  );
};

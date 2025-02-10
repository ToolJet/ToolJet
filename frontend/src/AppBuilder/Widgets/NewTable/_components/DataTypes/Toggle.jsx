// TODO: Remove getTableColumnEvents when the toggle column is removed as it is used only for the toggle column
import React, { useState, useCallback, useEffect } from 'react';
import useTableStore from '../../_stores/tableStore';

export const ToggleColumn = ({ id, value, readOnly, onChange, activeColor }) => {
  const [isOn, setIsOn] = useState(() => value);

  const { getTableColumnEvents } = useTableStore();

  // Sync internal state with external value
  useEffect(() => {
    setIsOn(value);
  }, [value]);

  const handleToggle = useCallback(() => {
    if (!readOnly) {
      const newValue = !isOn;
      setIsOn(newValue);
      onChange(newValue, getTableColumnEvents(id));
    }
  }, [isOn, readOnly, onChange, id, getTableColumnEvents]);

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

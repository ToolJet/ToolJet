import React, { useState, useEffect } from 'react';

function Checkbox({ value, onChange, label, meta }) {
  const [isChecked, setIsChecked] = useState(value); // Initial state of the checkbox
  useEffect(() => {
    setIsChecked(value);
  }, [value]);

  // Use checkboxLabel from meta if provided, otherwise fall back to label prop or default
  const checkboxLabel = meta?.checkboxLabel ?? label ?? 'Auto width';

  return (
    <div className="d-flex align-items-center color-slate12" style={{ width: '142px' }}>
      <input
        data-cy={`auto-width-checkbox`}
        type="checkbox"
        checked={isChecked}
        onChange={() => {
          setIsChecked(!isChecked); // Toggle the checkbox state
          onChange(`{{${!isChecked}}}`);
        }}
        value={isChecked}
        style={{ height: '16px', width: '16px' }}
      />
      <span className="tj-text-xsm" style={{ marginLeft: '8px' }} data-cy={`auto-width-label`}>
        {checkboxLabel}
      </span>
    </div>
  );
}

export default Checkbox;

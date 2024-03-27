import React, { useState, useEffect } from 'react';

function Checkbox({ value, onChange }) {
  const [isChecked, setIsChecked] = useState(value); // Initial state of the checkbox

  useEffect(() => {
    setIsChecked(value);
  }, [value]);

  return (
    <div className="d-flex align-items-center color-slate12" style={{ width: '142px', marginTop: '16px' }}>
      <input
        data-cy={`auto-width-checkbox`}
        type="checkbox"
        checked={isChecked}
        onChange={() => {
          setIsChecked(!isChecked); // Toggle the checkbox state
          onChange(!isChecked);
        }}
        value={isChecked}
        style={{ height: '16px', width: '16px' }}
      />
      <span className="tj-text-xsm" style={{ marginLeft: '8px' }} data-cy={`auto-width-label`}>
        Auto width
      </span>
    </div>
  );
}

export default Checkbox;

import React, { useState, useEffect } from 'react';

function Checkbox({ value, onChange }) {
  const [isChecked, setIsChecked] = useState(value); // Initial state of the checkbox

  useEffect(() => {
    setIsChecked(value);
  }, [value]);

  return (
    <div className="d-flex align-items-center" style={{ width: '142px' }}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => {
          setIsChecked(!isChecked); // Toggle the checkbox state
          onChange(!isChecked);
        }}
        value={isChecked}
        style={{ height: '16px', width: '16px' }}
      />
      <span className="tj-text-xsm" style={{ marginLeft: '4px' }}>
        Auto width
      </span>
    </div>
  );
}

export default Checkbox;

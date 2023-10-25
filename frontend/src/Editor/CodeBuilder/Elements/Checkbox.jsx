import React, { useState } from 'react';

function Checkbox({ value, onChange }) {
  const [isChecked, setIsChecked] = useState(value); // Initial state of the checkbox

  return (
    <div className="d-flex">
      {isChecked}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => {
          setIsChecked(!isChecked); // Toggle the checkbox state
          onChange(!isChecked);
        }}
      />
      <span className="tj-text-xsm" style={{ marginLeft: '4px' }}>
        Auto width
      </span>
    </div>
  );
}

export default Checkbox;

import React, { useState } from 'react';

export const Toggle = ({ readOnly, value, onChange, activeColor, id }) => {
  const [on, setOn] = useState(() => value);

  const toggle = () => {
    setOn((prev) => !prev);
    onChange(!on);
  };

  return (
    <div className="custom-toggle-switch d-flex col gap-2 align-items-center">
      <label className="switch">
        <input
          type="checkbox"
          id={id}
          checked={on}
          style={on ? { backgroundColor: activeColor } : {}}
          onClick={() => {
            if (!readOnly) toggle();
          }}
          disabled={readOnly}
        />
        <label htmlFor={id} className="slider round"></label>
      </label>
    </div>
  );
};

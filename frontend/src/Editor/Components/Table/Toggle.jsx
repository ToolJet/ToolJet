import React, { useState } from 'react';

export const Toggle = ({readOnly, value, onChange, options }) => {
  const [on, setOn] = useState(() => value)

  const toggle = () => {
    setOn((prev) => !prev)
    onChange(!on)
  }

  return (
    <div className="radio row">
      <div>
        <label className="form-check form-switch form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              checked={on}
              onClick={() => {if(!readOnly) toggle()}}
            />
        </label>
      </div>
    </div>
  );
};
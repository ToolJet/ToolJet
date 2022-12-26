import React from 'react';
export default ({ defaultChecked, onChange, checked }) => {
  return (
    <label className="form-switch">
      <input
        className="form-check-input"
        checked={checked}
        type="checkbox"
        defaultChecked={defaultChecked}
        onChange={onChange}
      />
    </label>
  );
};

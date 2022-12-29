import React from 'react';
export default ({ defaultChecked, onChange, checked = false, classes = {} }) => {
  return (
    <label className={`form-switch ${classes?.wrapper}`}>
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

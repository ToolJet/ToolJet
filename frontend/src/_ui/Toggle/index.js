import React from 'react';
export default ({ defaultChecked, onChange }) => {
  return (
    <label className="form-switch">
      <input className="form-check-input" type="checkbox" defaultChecked={defaultChecked} onChange={onChange} />
    </label>
  );
};

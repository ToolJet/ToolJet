import React from 'react'
export default ({ defaultChecked, onChange }) => {
  return (
    <label className="form-check form-switch mt-3">
      <input className="form-check-input" type="checkbox" defaultChecked={defaultChecked} onChange={onChange} />
    </label>
  );
};

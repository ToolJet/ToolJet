import React from 'react';
// not robust/ready yet
const Checkbox = ({ type = 'checkbox', size = 'sm', text = '', supportingText = '' }) => {
  const baseHeight = size === 'sm' ? 16 : 20;
  const baseWidth = size === 'sm' ? 16 : 20;

  return (
    <div className="d-inline-flex custom-gap-6 align-items-center">
      <input type={type} style={{ width: baseWidth, height: baseHeight }} />
      <div className="d-flex flex-column align-items-start custom-gap-2">
        {text ? <span>{text}</span> : ''}
        {supportingText ? <span>{supportingText}</span> : ''}
      </div>
    </div>
  );
};
export default Checkbox;

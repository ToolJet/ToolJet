import React from 'react';

const Input = ({ helpText, ...props }) => (
  <div className="tj-app-input">
    <input {...props} />
    {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
  </div>
);

export default Input;

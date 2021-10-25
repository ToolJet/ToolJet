import React from 'react';

const Input = ({ helpText, ...props }) => (
  <>
    <textarea {...props} />
    {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
  </>
);

export default Input;

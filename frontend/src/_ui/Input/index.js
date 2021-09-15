import React from 'react';

const Input = ({ helpText, ...props }) => (
  <>
    <input {...props} />
    {helpText && <small class="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
  </>
);

export default Input;

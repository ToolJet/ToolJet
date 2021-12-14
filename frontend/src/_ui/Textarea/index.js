import React from 'react';

const Textarea = ({ helpText, ...props }) => (
  <>
    <textarea {...props} />
    {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
  </>
);

export default Textarea;

import React from 'react';

const Textarea = ({ helpText, ...props }) => (
  <div className="tj-app-input">
    <textarea {...props} />
    {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
  </div>
);

export default Textarea;

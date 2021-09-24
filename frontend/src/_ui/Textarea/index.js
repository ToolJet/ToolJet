import React from 'react';

const Textarea = ({ ...props }) => (
  <textarea data-bs-toggle="autosize" {...props} />
);

export default Textarea;

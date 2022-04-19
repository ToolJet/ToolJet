import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Html = function ({ width, height, properties, styles }) {
  const { rawHtml: stringifyHTML } = properties;
  const { visibility } = styles;

  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    setRawHtml(stringifyHTML);
  }, [stringifyHTML]);

  return (
    <div style={{ display: visibility ? '' : 'none', width: '100%', height, overflowY: 'auto' }}>
      {<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }} />}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Html = function ({ height, properties, styles, darkMode }) {
  const { rawHtml: stringifyHTML } = properties;
  const baseStyle = {
    backgroundColor: darkMode ? '#47505D' : '#ffffff',
    color: darkMode ? 'white' : 'black',
  };
  const { visibility } = styles;

  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    setRawHtml(stringifyHTML);
  }, [stringifyHTML]);

  return (
    <div style={{ display: visibility ? '' : 'none', width: '100%', height, overflowY: 'auto' }}>
      {
        <div
          style={baseStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml, { FORCE_BODY: true }) }}
        />
      }
    </div>
  );
};

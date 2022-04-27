import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Html = function ({ width, height, properties, styles, darkMode }) {
  const { rawHtml: stringifyHTML, rawCSS: stringifyCSS } = properties;
  const baseStyle = stringifyCSS
    ? null
    : {
        backgroundColor: darkMode ? '#47505D' : '#ffffff',
        color: darkMode ? 'white' : 'black',
      };
  console.log(baseStyle);
  const { visibility } = styles;

  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    setRawHtml(stringifyHTML + stringifyCSS);
  }, [stringifyHTML, stringifyCSS]);

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

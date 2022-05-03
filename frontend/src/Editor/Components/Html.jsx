import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Html = function ({ width, height, properties, styles, darkMode }) {
  const { rawHtml: stringifyHTML, rawCSS: stringifyCSS } = properties;
  const css = stringifyCSS
    .split('}')
    .reduce((acc, cv) => {
      if (cv) {
        acc.push(`.custom_css ${cv}}`);
      }
      return acc;
    }, [])
    .join('');
  const baseStyle = stringifyCSS
    ? null
    : {
        backgroundColor: darkMode ? '#47505D' : '#ffffff',
        color: darkMode ? 'white' : 'black',
      };
  const { visibility } = styles;

  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    setRawHtml(stringifyHTML + `<style>${css}</style>`);
  }, [stringifyHTML, stringifyCSS]);

  return (
    <div style={{ display: visibility ? '' : 'none', width: '100%', height, overflowY: 'auto' }}>
      {
        <div
          className="custom_css"
          style={baseStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml, { FORCE_BODY: true }) }}
        />
      }
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export const Html = function ({ height, properties, styles, darkMode, dataCy }) {
  const { rawHtml: stringifyHTML } = properties;
  const baseStyle = {
    backgroundColor: darkMode ? '#47505D' : '#ffffff',
    color: darkMode ? 'white' : 'black',
  };
  const { visibility, boxShadow } = styles;

  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    setRawHtml(stringifyHTML);
  }, [stringifyHTML]);
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    // set all elements owning target to target=_blank
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener');
    }
  });

  return (
    <div
      style={{
        display: visibility ? '' : 'none',
        width: '100%',
        height,
        overflowY: 'auto',
        boxShadow,
      }}
      data-cy={dataCy}
    >
      {
        <div
          style={baseStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml, { FORCE_BODY: true }) }}
        />
      }
    </div>
  );
};

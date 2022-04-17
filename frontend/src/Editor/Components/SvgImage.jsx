import React from 'react';
import DOMPurify from 'dompurify';

export const SvgImage = function Timeline({ properties, styles }) {
  const { visibility } = styles;
  const { data } = properties;
  return (
    <div style={{ display: visibility ? '' : 'none', overflow: 'hidden' }}>
      <div
        // style={{ display: visibility ? '' : 'none', overflow: 'hidden' }}
        style={{ overflow: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}
      ></div>
    </div>
  );
};

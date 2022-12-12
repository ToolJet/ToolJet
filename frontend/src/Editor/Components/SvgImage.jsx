import React from 'react';
import DOMPurify from 'dompurify';

export const SvgImage = function Timeline({ properties, styles, height }) {
  const { visibility } = styles;
  const { data } = properties;
  return (
    <div style={{ display: visibility ? '' : 'none', overflow: 'hidden', height: height }}>
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}></div>
    </div>
  );
};

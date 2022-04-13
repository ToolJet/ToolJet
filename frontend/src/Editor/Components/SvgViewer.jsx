import React from 'react';
import DOMPurify from 'dompurify';

export const SvgViewer = function Timeline({ properties, styles }) {
  const { visibility } = styles;
  const { data } = properties;
  return (
    <div
      style={{ display: visibility ? '' : 'none', height: 'auto', width: 'auto' }}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}
    ></div>
  );
};

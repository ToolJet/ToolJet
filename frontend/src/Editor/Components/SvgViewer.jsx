import React from 'react';
import DOMPurify from 'dompurify';

export const SvgViewer = function Timeline({ height, properties, styles }) {
  const { visibility } = styles;
  const { data } = properties;
  const computedStyles = {
    height: 'auto',
  };
  return (
    <div
      className=""
      style={{ display: visibility ? '' : 'none', height: 'auto' }}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}
    ></div>
  );
};

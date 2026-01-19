import React from 'react';
import DOMPurify from 'dompurify';

/**
 * HtmlFieldAdapter - KeyValuePair adapter for HTML display
 *
 * Displays sanitized HTML content.
 */
export const HtmlField = ({ value, darkMode = false, horizontalAlignment = 'left' }) => {
  const getCellValue = (val) => {
    let transformedValue = val;
    if (typeof val !== 'string') {
      try {
        transformedValue = String(val);
      } catch {
        transformedValue = '';
      }
    }
    return DOMPurify.sanitize(transformedValue.trim());
  };

  return (
    <div
      className="key-value-html"
      style={{
        textAlign: horizontalAlignment,
        color: darkMode ? 'var(--text-primary)' : 'inherit',
      }}
      dangerouslySetInnerHTML={{ __html: getCellValue(value) }}
    />
  );
};

export default HtmlField;

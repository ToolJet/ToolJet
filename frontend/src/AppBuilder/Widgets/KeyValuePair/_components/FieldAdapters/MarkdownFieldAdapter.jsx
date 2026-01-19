import React from 'react';
import { default as ReactMarkdown } from 'react-markdown';
import DOMPurify from 'dompurify';

/**
 * MarkdownFieldAdapter - KeyValuePair adapter for Markdown display
 *
 * Displays markdown content with proper rendering.
 */
export const MarkdownField = ({ value, darkMode = false, horizontalAlignment = 'left' }) => {
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
      className="key-value-markdown"
      style={{
        textAlign: horizontalAlignment,
        color: darkMode ? 'var(--text-primary)' : 'inherit',
      }}
    >
      <ReactMarkdown>{getCellValue(value)}</ReactMarkdown>
    </div>
  );
};

export default MarkdownField;

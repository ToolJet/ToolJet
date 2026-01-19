import React from 'react';
import DOMPurify from 'dompurify';

/**
 * JsonFieldAdapter - KeyValuePair adapter for JSON display
 *
 * Displays JSON data with optional formatting.
 */
export const JsonField = ({ value, indentation = false, darkMode = false, horizontalAlignment = 'left' }) => {
  const formatValue = (val) => {
    try {
      if (typeof val === 'object' && val !== null) {
        return indentation ? JSON.stringify(val, null, 2) : JSON.stringify(val);
      }
      if (typeof val === 'string') {
        const parsed = JSON.parse(val);
        return indentation ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      }
      return String(val ?? '');
    } catch {
      return String(val ?? '');
    }
  };

  return (
    <pre
      style={{
        margin: 0,
        fontFamily: 'monospace',
        fontSize: '12px',
        whiteSpace: indentation ? 'pre-wrap' : 'nowrap',
        textAlign: horizontalAlignment,
        color: darkMode ? 'var(--text-primary)' : 'inherit',
      }}
    >
      {formatValue(value)}
    </pre>
  );
};

export default JsonField;

import React from 'react';

export const LinkColumn = ({ cellValue, linkTarget, linkColor, underlineColor, underline, displayText, darkMode }) => {
  return (
    <div className="h-100 d-flex align-items-center">
      <a
        href={cellValue}
        target={linkTarget ? '_blank' : '_self'}
        style={{
          color: linkColor,
          textDecoration: underline ? 'underline' : 'none',
          textDecorationColor: underlineColor,
        }}
        rel="noreferrer"
      >
        {displayText || cellValue}
      </a>
    </div>
  );
};

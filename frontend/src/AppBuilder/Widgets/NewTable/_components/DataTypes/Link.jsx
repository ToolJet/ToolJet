import React, { useMemo } from 'react';

export const LinkColumn = ({ cellValue, linkTarget, underline, underlineColor, linkColor, displayText, darkMode }) => {
  const linkTextColor = useMemo(
    () => (linkColor !== '#1B1F24' ? linkColor : darkMode && linkColor === '#1B1F24' ? '#FFFFFF' : linkColor),
    [linkColor, darkMode]
  );

  return (
    <div className="h-100 d-flex align-items-center">
      <a
        className={underline === 'hover' ? 'table-link-hover' : 'table-link'}
        href={cellValue}
        target={linkTarget === '_self' || !linkTarget ? '_self' : '_blank'}
        onClick={(e) => e.stopPropagation()}
        style={{
          color: linkTextColor,
          textDecoration: underline === 'always' ? 'underline' : 'none',
          textDecorationColor: underlineColor,
        }}
        rel="noopener noreferrer"
      >
        {displayText || String(cellValue)}
      </a>
    </div>
  );
};

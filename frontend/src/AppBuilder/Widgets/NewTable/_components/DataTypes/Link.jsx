import React, { useMemo } from 'react';

export const LinkColumn = ({ cellValue, linkTarget, underline, underlineColor, linkColor, displayText, darkMode }) => {
  const linkTextColor = useMemo(
    () => (linkColor !== '#1B1F24' ? linkColor : darkMode && linkColor === '#1B1F24' ? '#FFFFFF' : linkColor),
    [linkColor, darkMode]
  );

  return (
    <div className="h-100 d-flex align-items-center">
      <div className="w-100">
        <a
          className={underline === 'hover' ? 'table-link-hover' : 'table-link'}
          href={cellValue}
          target={linkTarget === '_self' || linkTarget == false ? '_self' : '_blank'}
          onClick={(e) => e.stopPropagation()}
          style={{
            color: linkTextColor,
            textDecoration: underline === 'always' && 'underline',
            textDecorationColor: underlineColor,
          }}
          rel="noopener noreferrer"
        >
          {displayText || String(cellValue)}
        </a>
      </div>
    </div>
  );
};

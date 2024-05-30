import React from 'react';

export const Link = ({ cellValue, linkTarget, underline, underlineColor, linkColor, displayText, darkMode }) => {
  const linkTextColor =
    linkColor !== '#1B1F24'
      ? linkColor ?? 'inherit'
      : darkMode && linkColor === '#1B1F24'
      ? '#FFFFFF'
      : linkColor ?? 'inherit';
  return (
    <div className="w-100 table-link-column">
      <a
        className={underline === 'hover' ? 'table-link-hover' : 'table-link'}
        href={cellValue}
        target={linkTarget == '_self' || linkTarget == false ? '_self' : '_blank'}
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          color: linkTextColor,
          textDecoration: underline === 'always' && 'underline', // Apply underline always or only on hover
          textDecorationColor: underlineColor ?? 'inherit',
        }}
        rel="noreferrer"
      >
        {displayText ? displayText : cellValue}
      </a>
    </div>
  );
};

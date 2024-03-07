import React from 'react';

export const Link = ({ cellValue, linkTarget, underline, underlineColor, linkColor, displayText }) => {
  console.log('linkTarget---', linkTarget);
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
          color: linkColor,
          textDecoration: underline === 'always' && 'underline', // Apply underline always or only on hover
          textDecorationColor: underlineColor,
        }}
        rel="noreferrer"
      >
        {displayText ? displayText : cellValue}
      </a>
    </div>
  );
};

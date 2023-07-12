import React from 'react';

export const Link = ({ href, cellValue, linkTarget }) => {
  return (
    <div>
      <a
        href={href}
        target={linkTarget}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {cellValue}
      </a>
    </div>
  );
};

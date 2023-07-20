import React from 'react';

export const Link = ({ cellValue, linkTarget }) => {
  return (
    <div>
      <a
        href={cellValue}
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

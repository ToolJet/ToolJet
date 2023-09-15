import React from 'react';

export const Link = ({ cellValue, linkTarget }) => {
  return (
    <div className="w-100">
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

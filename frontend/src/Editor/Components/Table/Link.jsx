import React from 'react';

export const Link = ({ linkKey = 'https://dev.to/', linkLabel, linkTarget }) => {
  return (
    <div>
      <a
        href={linkKey}
        target={linkTarget}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {linkLabel ?? linkKey}
      </a>
    </div>
  );
};

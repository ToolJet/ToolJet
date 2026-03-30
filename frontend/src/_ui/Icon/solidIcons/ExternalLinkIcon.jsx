import React from 'react';

const ExternalLinkIcon = ({ fill = '#C1C8CD', width = '16', className = '', viewBox = '0 0 16 16' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M13 3L13 7M13 3L9 3M13 3L8 8"
      stroke={fill}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 9V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V4C2 3.44772 2.44772 3 3 3H7"
      stroke={fill}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default ExternalLinkIcon;

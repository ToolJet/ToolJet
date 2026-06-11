import React from 'react';

const ChevronDownSmall = ({ fill = '#C1C8CD', width = '12', className = '', viewBox = '0 0 12 12' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M3 4.5L6 7.5L9 4.5" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ChevronDownSmall;

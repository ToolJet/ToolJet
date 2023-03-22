import React from 'react';

const Row = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6 22L18 22C20.2091 22 22 20.2091 22 18L22 16L2 16L2 18C2 20.2091 3.79086 22 6 22Z" fill={fill} />
    <g opacity="0.4">
      <path d="M18 2L6 2C3.79086 2 2 3.79086 2 6L2 16L22 16L22 6C22 3.79086 20.2091 2 18 2Z" fill={fill} />
    </g>
  </svg>
);

export default Row;

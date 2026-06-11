import React from 'react';

const Copy = ({ fill = '#C1C8CD', width = '25', className = 'tj-icon', viewBox = '0 0 25 25', onClick }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    onClick={onClick}
    className={className}
  >
    <path
      opacity="0.4"
      d="M8 6C8 3.79086 9.79086 2 12 2H18C20.2092 2 22 3.79086 22 6V12C22 14.2091 20.2092 16 18 16H12C9.79086 16 8 14.2091 8 12V6Z"
      fill={fill}
    />
    <path
      d="M2 12C2 9.79086 3.79086 8 6 8H12C14.2092 8 16 9.79086 16 12V18C16 20.2091 14.2092 22 12 22H6C3.79086 22 2 20.2091 2 18V12Z"
      fill={fill}
    />
  </svg>
);

export default Copy;

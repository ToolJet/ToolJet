import React from 'react';

const Minus01 = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      opacity="0.4"
      d="M18 10C19.1046 10 20 10.8954 20 12C20 13.1046 19.1046 14 18 14L6 14C4.89543 14 4 13.1046 4 12C4 10.8954 4.89543 10 6 10L18 10Z"
      fill={fill}
    />
  </svg>
);

export default Minus01;

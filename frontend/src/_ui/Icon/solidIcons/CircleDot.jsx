import React from 'react';

const CircleDot = ({ fill = '#C1C8CD', width = '14', className = '', viewBox = '0 0 16 16' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="8" cy="8" r="3" fill={fill} />
  </svg>
);

export default CircleDot;

import React from 'react';

const LoadingState = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
  >
    <circle opacity="0.3" cx="4" cy="4.75732" r="4" fill={fill} />
    <circle cx="16" cy="4.75732" r="4" fill={fill} />
    <circle opacity="0.3" cx="28" cy="4.75732" r="4" fill={fill} />
  </svg>
);

export default LoadingState;

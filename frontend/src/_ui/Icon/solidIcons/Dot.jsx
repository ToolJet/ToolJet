import React from 'react';

const Dot = ({ fill = '#C1C8CD', width = '8', className = 'tj-icon', viewBox = '0 0 8 8' }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height="8"
      viewBox={viewBox}
      fill="none"
    >
      <circle cx="4" cy="4" r="3" fill={fill} />
    </svg>
  );
};
export default Dot;

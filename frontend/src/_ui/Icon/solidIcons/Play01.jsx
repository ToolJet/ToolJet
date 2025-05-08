import React from 'react';

const Play01 = ({ fill = '#6A727C', width = '24', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.5904 14.6487L7.43642 21.5939C5.40287 22.7559 2.87265 21.2875 2.87265 18.9454V5.05514C2.87265 2.71301 5.40287 1.24466 7.43642 2.40669L19.5904 9.35182C21.6397 10.5228 21.6397 13.4777 19.5904 14.6487Z"
      fill={fill}
    />
  </svg>
);

export default Play01;

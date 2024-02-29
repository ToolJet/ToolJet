import React from 'react';

const ArrowUpTriangle = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M18.7908 13.2475C18.9951 13.5411 19.0562 13.9827 18.9456 14.3663C18.8351 14.7499 18.5746 15 18.2857 15L9.71432 15C9.42539 15 9.16496 14.7499 9.05439 14.3663C8.94382 13.9827 9.00497 13.5411 9.20925 13.2475L13.2424 7.45095C13.6608 6.84968 14.3392 6.84968 14.7576 7.45095L18.7908 13.2475Z"
      fill={fill}
    />
  </svg>
);

export default ArrowUpTriangle;

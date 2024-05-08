import React from 'react';

const TriangleDownCenter = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24', style }) => (
  <svg
    className={className}
    width={width}
    height={width}
    viewBox={viewBox}
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.40924 13.2472C7.20496 13.5408 7.14385 13.9823 7.25441 14.3659C7.36496 14.7495 7.62542 14.9996 7.91432 14.9996L16.4857 14.9996C16.7746 14.9996 17.035 14.7495 17.1456 14.3659C17.2562 13.9823 17.195 13.5408 16.9908 13.2472L12.9576 7.45058C12.5392 6.84932 11.8608 6.84932 11.4424 7.45058L7.40924 13.2472Z"
      fill={fill}
    />
  </svg>
);

export default TriangleDownCenter;

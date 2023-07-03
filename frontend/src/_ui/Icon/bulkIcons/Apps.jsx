import React from 'react';

const Apps = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    data-cy="apps-icon"
  >
    <path
      d="M20 17C20 18.6569 18.6569 20 17 20C15.3431 20 14 18.6569 14 17C14 15.3431 15.3431 14 17 14C18.6569 14 20 15.3431 20 17Z"
      fill={fill}
    />
    <g opacity="0.4">
      <path
        d="M14 6C14 4.89543 14.8954 4 16 4H18C19.1046 4 20 4.89543 20 6V8C20 9.10457 19.1046 10 18 10H16C14.8954 10 14 9.10457 14 8V6Z"
        fill={fill}
      />
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H8C9.10457 4 10 4.89543 10 6V8C10 9.10457 9.10457 10 8 10H6C4.89543 10 4 9.10457 4 8V6Z"
        fill={fill}
      />
      <path
        d="M4 16C4 14.8954 4.89543 14 6 14H8C9.10457 14 10 14.8954 10 16V18C10 19.1046 9.10457 20 8 20H6C4.89543 20 4 19.1046 4 18V16Z"
        fill={fill}
      />
    </g>
  </svg>
);

export default Apps;

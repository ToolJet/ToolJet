import React from 'react';

const Mobiles = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      fillRule="evenodd"
      d="M8.5 2.79a3 3 0 00-3 3v14a3 3 0 003 3h8a3 3 0 003-3v-14a3 3 0 00-3-3h-8zm3 16.25a.75.75 0 100 1.5h2a.75.75 0 000-1.5h-2z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Mobiles;

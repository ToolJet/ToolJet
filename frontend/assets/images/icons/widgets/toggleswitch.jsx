import React from 'react';

const Toggleswitch = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M12.317 2a9.429 9.429 0 000 18.857H37.46A9.429 9.429 0 1037.46 2H12.317zm0 25.143a9.429 9.429 0 000 18.857H37.46a9.428 9.428 0 009.429-9.429 9.428 9.428 0 00-9.429-9.428H12.317z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M35.889 16.141a4.714 4.714 0 100-9.428 4.714 4.714 0 000 9.428zm-22 25.143a4.714 4.714 0 100-9.429 4.714 4.714 0 000 9.429z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Toggleswitch;

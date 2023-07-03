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
      opacity="0.4"
      d="M5 5C5 3.34315 6.34315 2 8 2H16C17.6569 2 19 3.34315 19 5V19C19 20.6569 17.6569 22 16 22H8C6.34315 22 5 20.6569 5 19V5Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.25 19C10.25 18.5858 10.5858 18.25 11 18.25H13C13.4142 18.25 13.75 18.5858 13.75 19C13.75 19.4142 13.4142 19.75 13 19.75H11C10.5858 19.75 10.25 19.4142 10.25 19Z"
      fill={fill}
    />
  </svg>
);

export default Mobiles;

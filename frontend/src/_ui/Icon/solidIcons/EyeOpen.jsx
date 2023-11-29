import React from 'react';

const EyeOpen = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M13.25 3.539a.75.75 0 00-1.5 0v2a.75.75 0 001.5 0v-2zM4.03 6.009a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.06-1.06l-1.5-1.5zM22.03 7.07a.75.75 0 00-1.06-1.061l-1.5 1.5a.75.75 0 001.06 1.06l1.5-1.5z"
    ></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M21.377 13.11c1.497 1.433 1.497 3.925 0 5.358-2.064 1.976-5.273 4.321-8.877 4.321-3.604 0-6.813-2.345-8.877-4.321-1.497-1.433-1.497-3.925 0-5.358 2.064-1.975 5.273-4.32 8.877-4.32 3.604 0 6.813 2.345 8.877 4.32zM15.5 15.79a3 3 0 11-6-.001 3 3 0 016 0z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default EyeOpen;

import React from 'react';

const Moon = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M5.67161 14.8687C10.751 14.8687 14.8686 10.751 14.8686 5.67163C14.8686 4.74246 14.7308 3.84548 14.4746 3C18.251 4.14461 21 7.65276 21 11.803C21 16.8824 16.8823 21 11.803 21C7.65275 21 4.14459 18.251 2.99998 14.4746C3.84547 14.7309 4.74245 14.8687 5.67161 14.8687Z"
      fill={fill}
    />
  </svg>
);

export default Moon;

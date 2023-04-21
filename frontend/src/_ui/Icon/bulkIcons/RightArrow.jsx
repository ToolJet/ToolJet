import React from 'react';

const RightArrow = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M7 15.5179V8.48202C7 6.93844 8.67443 5.97669 10.0077 6.75446L16.0385 10.2724C17.3615 11.0441 17.3615 12.9557 16.0385 13.7275L10.0077 17.2454C8.67443 18.0232 7 17.0615 7 15.5179Z"
      fill={fill}
    />
  </svg>
);

export default RightArrow;

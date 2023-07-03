import React from 'react';

const UpArrow = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M8.48208 17.0154H15.5179C17.0615 17.0154 18.0233 15.3409 17.2455 14.0076L13.7276 7.97688C12.9558 6.65387 11.0442 6.65387 10.2724 7.97688L6.75452 14.0076C5.97675 15.3409 6.9385 17.0154 8.48208 17.0154Z"
      fill={fill}
    />
  </svg>
);

export default UpArrow;

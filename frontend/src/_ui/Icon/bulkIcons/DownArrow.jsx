import React from 'react';

const DownArrow = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M15.5179 7L8.48208 7C6.9385 7 5.97675 8.67443 6.75452 10.0077L10.2724 16.0385C11.0442 17.3615 12.9558 17.3615 13.7276 16.0385L17.2455 10.0077C18.0233 8.67443 17.0615 7 15.5179 7Z"
      fill={fill}
    />
  </svg>
);

export default DownArrow;

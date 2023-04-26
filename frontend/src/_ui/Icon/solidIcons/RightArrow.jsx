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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.5 16.307V9.27114C7.5 7.72755 9.17443 6.76581 10.5077 7.54358L16.5385 11.0615C17.8615 11.8333 17.8615 13.7449 16.5385 14.5166L10.5077 18.0345C9.17443 18.8123 7.5 17.8506 7.5 16.307Z"
      fill={fill}
    />
  </svg>
);

export default RightArrow;

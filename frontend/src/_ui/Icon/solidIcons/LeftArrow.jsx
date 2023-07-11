import React from 'react';

const LeftArrow = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M17.5 16.307V9.27114C17.5 7.72755 15.8256 6.76581 14.4923 7.54358L8.46153 11.0615C7.13852 11.8333 7.13852 13.7449 8.46153 14.5166L14.4923 18.0345C15.8256 18.8123 17.5 17.8506 17.5 16.307Z"
      fill={fill}
    />
  </svg>
);

export default LeftArrow;

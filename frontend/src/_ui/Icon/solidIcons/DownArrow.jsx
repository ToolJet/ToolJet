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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.0179 6.78906L8.98207 6.78906C7.43849 6.78906 6.47675 8.46349 7.25451 9.7968L10.7724 15.8275C11.5442 17.1505 13.4558 17.1505 14.2276 15.8275L17.7455 9.79681C18.5232 8.46349 17.5615 6.78906 16.0179 6.78906Z"
      fill={fill}
    />
  </svg>
);

export default DownArrow;

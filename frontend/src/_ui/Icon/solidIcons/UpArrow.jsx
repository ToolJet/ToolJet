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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.98207 17.7891L16.0179 17.7891C17.5615 17.7891 18.5233 16.1146 17.7455 14.7813L14.2276 8.75059C13.4558 7.42758 11.5442 7.42758 10.7724 8.75059L7.25452 14.7813C6.47675 16.1146 7.43849 17.7891 8.98207 17.7891Z"
      fill={fill}
    />
  </svg>
);

export default UpArrow;

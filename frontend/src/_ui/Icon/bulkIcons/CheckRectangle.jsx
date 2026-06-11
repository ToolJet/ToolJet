import React from 'react';

const CheckRectangle = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M6 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6C2 3.79086 3.79086 2 6 2Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.4605 8.40802C16.7874 8.66232 16.8463 9.13353 16.592 9.46049L12.585 14.6123C11.9613 15.4143 10.7881 15.5183 10.033 14.8387L7.49828 12.5575C7.1904 12.2804 7.16544 11.8062 7.44254 11.4983C7.71963 11.1904 8.19385 11.1655 8.50173 11.4426L11.0364 13.7238C11.1443 13.8209 11.3119 13.806 11.401 13.6914L15.408 8.53958C15.6623 8.21262 16.1335 8.15372 16.4605 8.40802Z"
      fill={fill}
    />
  </svg>
);

export default CheckRectangle;

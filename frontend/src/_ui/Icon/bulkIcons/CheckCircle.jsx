import React from 'react';

const CheckCircle = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
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

export default CheckCircle;

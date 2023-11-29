import React from 'react';

const Statistics = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M2.889 43.564a2.37 2.37 0 012.37-2.37h39.26a2.37 2.37 0 010 4.74H5.258a2.37 2.37 0 01-2.37-2.37z"
      clipRule="evenodd"
    ></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M5.26 2.065a1.58 1.58 0 00-1.58 1.58V36.2c0 .873.708 1.58 1.58 1.58h8.33a1.58 1.58 0 001.58-1.58V3.646a1.58 1.58 0 00-1.58-1.58H5.26zM20.726 18.48a1.58 1.58 0 00-1.58 1.58v16.138c0 .873.707 1.58 1.58 1.58h8.33a1.58 1.58 0 001.58-1.58V20.06a1.58 1.58 0 00-1.58-1.58h-8.33zM34.609 8.143c0-.873.707-1.58 1.58-1.58h8.33c.873 0 1.58.707 1.58 1.58v28.055a1.58 1.58 0 01-1.58 1.58h-8.33a1.58 1.58 0 01-1.58-1.58V8.143z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Statistics;

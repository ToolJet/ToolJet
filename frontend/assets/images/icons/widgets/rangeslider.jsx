import React from 'react';

const Rangeslider = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      fillRule="evenodd"
      d="M2.889 24a2.357 2.357 0 012.357-2.357H44.53a2.357 2.357 0 010 4.714H5.247A2.357 2.357 0 012.889 24z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M2.889 24a2.357 2.357 0 012.357-2.357h24.096a2.357 2.357 0 010 4.714H5.246A2.357 2.357 0 012.889 24z"
      clipRule="evenodd"
    ></path>
    <rect width="5.459" height="13.783" x="27.755" y="17.109" fill="#3E63DD" rx="2.729"></rect>
  </svg>
);

export default Rangeslider;

import React from 'react';

const TextArea = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M8.389 4.357A2.357 2.357 0 0110.746 2H39.03a2.357 2.357 0 012.358 2.357v7.857a2.357 2.357 0 01-4.715 0v-5.5h-9.428V31.86h3.928a2.357 2.357 0 010 4.715H18.603a2.357 2.357 0 110-4.715h3.928V6.714h-9.428v5.5a2.357 2.357 0 01-4.714 0V4.357z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M2.889 43.643a2.357 2.357 0 012.357-2.357H44.53a2.357 2.357 0 010 4.714H5.247a2.357 2.357 0 01-2.357-2.357z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default TextArea;

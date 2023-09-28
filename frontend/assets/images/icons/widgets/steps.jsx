import React from 'react';

const Steps = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M11.532 24c0-1.42 1.055-2.572 2.357-2.572h26.374c1.302 0 2.357 1.152 2.357 2.572 0 1.42-1.055 2.571-2.357 2.571H13.89c-1.302 0-2.357-1.151-2.357-2.571z"
      clipRule="evenodd"
    ></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M9.174 17.834c-3.471 0-6.285 2.76-6.285 6.166 0 3.405 2.814 6.165 6.285 6.165 3.472 0 6.286-2.76 6.286-6.165 0-3.405-2.814-6.166-6.286-6.166zm15.715 0c-3.472 0-6.286 2.76-6.286 6.166 0 3.405 2.814 6.165 6.286 6.165 3.471 0 6.285-2.76 6.285-6.165 0-3.405-2.814-6.166-6.285-6.166zM34.317 24c0-3.405 2.814-6.166 6.286-6.166 3.472 0 6.286 2.76 6.286 6.166 0 3.405-2.814 6.165-6.286 6.165-3.472 0-6.286-2.76-6.286-6.165z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Steps;

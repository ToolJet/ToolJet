import React from 'react';

const BoundedBox = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M7.603 8.286A4.714 4.714 0 002.889 13v22a4.714 4.714 0 004.714 4.714h34.571A4.714 4.714 0 0046.89 35V13a4.714 4.714 0 00-4.715-4.714H7.603z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M12.526 15.75c1.085 0 1.964.88 1.964 1.964v12.572a1.964 1.964 0 01-3.928 0V17.714c0-1.084.879-1.964 1.964-1.964zm12.363 0c1.084 0 1.964.88 1.964 1.964v12.572a1.964 1.964 0 11-3.929 0V17.714c0-1.084.88-1.964 1.965-1.964zm14.326 1.964a1.964 1.964 0 10-3.928 0v12.572a1.964 1.964 0 103.928 0V17.714z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default BoundedBox;

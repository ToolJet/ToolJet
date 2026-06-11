import React from 'react';

const Button = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M2.889 16.714A4.714 4.714 0 017.603 12h34.571a4.714 4.714 0 014.715 4.714v14.572A4.714 4.714 0 0142.174 36H7.603a4.714 4.714 0 01-4.714-4.714V16.714z"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M18.603 24a3.143 3.143 0 11-6.286 0 3.143 3.143 0 016.286 0zm9.429 0a3.143 3.143 0 11-6.286 0 3.143 3.143 0 016.286 0zm6.285 3.143a3.143 3.143 0 100-6.286 3.143 3.143 0 000 6.286z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Button;

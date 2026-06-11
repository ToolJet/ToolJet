import React from 'react';

const RadioButton = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill={fill} d="M24.889 46c12.15 0 22-9.85 22-22s-9.85-22-22-22-22 9.85-22 22 9.85 22 22 22z"></path>
    <path fill="#3E63DD" d="M24.889 33a9 9 0 100-18 9 9 0 000 18z"></path>
  </svg>
);

export default RadioButton;

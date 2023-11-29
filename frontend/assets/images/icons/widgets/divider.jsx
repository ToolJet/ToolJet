import React from 'react';

const Divider = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M22.889 1.714a3.143 3.143 0 013.143 3.143v37.715a3.143 3.143 0 11-6.286 0V4.856a3.143 3.143 0 013.143-3.143z"
      clipRule="evenodd"
    ></path>
    <circle cx="22.889" cy="23.714" r="5.153" fill="#3E63DD" transform="rotate(90 22.889 23.714)"></circle>
  </svg>
);

export default Divider;

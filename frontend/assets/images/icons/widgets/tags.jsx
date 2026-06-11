import React from 'react';

const Tags = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M20.507 2.176a2.703 2.703 0 00-1.292-.154L7.24 3.867a2.734 2.734 0 00-2.484 2.485L2.91 18.327a2.703 2.703 0 00.797 2.272L27.96 44.85a3.93 3.93 0 005.553.001L45.74 32.625a3.93 3.93 0 000-5.553L21.488 2.82a2.703 2.703 0 00-.98-.644z"
    ></path>
    <path fill="#3E63DD" d="M15.463 17.717a3.143 3.143 0 100-6.285 3.143 3.143 0 000 6.285z"></path>
  </svg>
);

export default Tags;

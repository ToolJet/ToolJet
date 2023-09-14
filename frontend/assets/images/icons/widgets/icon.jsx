import React from 'react';

const Icon = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M24.889 2c-12.15 0-22 9.85-22 22s9.85 22 22 22 22-9.85 22-22-9.85-22-22-22z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M17.285 20.782a3.22 3.22 0 01.012-6.44h.013a3.22 3.22 0 01-.013 6.44h-.012zm-3.104 6.275a.786.786 0 00-.785.786c0 1.736.846 4.202 2.675 6.234 1.855 2.061 4.728 3.686 8.767 3.686s6.912-1.625 8.767-3.686c1.829-2.032 2.676-4.498 2.676-6.234a.786.786 0 00-.786-.786H14.18zm18.292-6.275a3.22 3.22 0 01.008-6.44h.007a3.22 3.22 0 01-.007 6.44h-.008z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Icon;

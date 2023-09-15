import React from 'react';

const Colorpicker = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M3.923 37.848l3.943-3.942c-2.177-4.1-1.398-9.283 1.886-12.562l9.311-9.31 17.793 17.792-9.312 9.31c-3.279 3.285-8.462 4.063-12.56 1.886l-3.944 3.943a3.56 3.56 0 01-5.017 0l-2.1-2.1a3.558 3.558 0 010-5.017z"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M24.628 5.802C29.656.734 38.06.732 43.09 5.8c5.066 5.03 5.065 13.434-.004 18.462l-2.559 2.559 3.355 3.355a2.36 2.36 0 01-3.337 3.336L15.377 8.344a2.36 2.36 0 013.337-3.337l3.355 3.355 2.559-2.56z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Colorpicker;

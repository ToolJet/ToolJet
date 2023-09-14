import React from 'react';

const Dropdown = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M8.271 12.575a5.382 5.382 0 00-5.382 5.382v12.086a5.383 5.383 0 005.382 5.382h33.236a5.382 5.382 0 005.382-5.382V17.957a5.382 5.382 0 00-5.383-5.382H8.272z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      d="M41.506 35.425a5.383 5.383 0 005.382-5.382V17.957a5.382 5.382 0 00-5.382-5.382H24.888v22.85h16.618z"
    ></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M30.741 21.823a1.574 1.574 0 011.455-.971h6.296a1.574 1.574 0 011.113 2.687l-3.148 3.148a1.574 1.574 0 01-2.226 0l-3.148-3.148a1.574 1.574 0 01-.342-1.716z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Dropdown;

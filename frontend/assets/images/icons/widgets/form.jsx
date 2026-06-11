import React from 'react';

const Form = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M43.746 16.143H6.032a3.143 3.143 0 00-3.143 3.143v9.428a3.143 3.143 0 003.143 3.143h37.714a3.143 3.143 0 003.143-3.143v-9.428a3.143 3.143 0 00-3.143-3.143z"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M13.103 9.857A2.357 2.357 0 0115.46 7.5h6.286a2.357 2.357 0 010 4.714h-.786v23.572h.786a2.357 2.357 0 010 4.714H15.46a2.357 2.357 0 010-4.714h.786V12.214h-.786a2.357 2.357 0 01-2.357-2.357z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Form;

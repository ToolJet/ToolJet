import React from 'react';

const Textinput = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M7.603 9.857a4.714 4.714 0 00-4.714 4.715v18.857a4.714 4.714 0 004.714 4.714h34.571a4.714 4.714 0 004.715-4.714V14.57a4.714 4.714 0 00-4.715-4.714H7.603z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M9.864 16.62a1.964 1.964 0 000 3.929h2.824v8.867a1.964 1.964 0 003.928 0v-8.867h2.824a1.964 1.964 0 000-3.929H9.864zM21.11 29.416c0-1.085.88-1.965 1.965-1.965h6.035a1.964 1.964 0 110 3.929h-6.035a1.964 1.964 0 01-1.965-1.964z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Textinput;

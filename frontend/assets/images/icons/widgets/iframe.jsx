import React from 'react';

const Iframe = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill="#3E63DD" d="M24.889 35c6.075 0 11-4.925 11-11s-4.925-11-11-11-11 4.925-11 11 4.925 11 11 11z"></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M7.833 6.944a.786.786 0 01.556-.23h4.714a2.357 2.357 0 000-4.714H8.389a5.5 5.5 0 00-5.5 5.5v4.714a2.357 2.357 0 004.714 0V7.5c0-.208.083-.408.23-.556zM46.89 35.786a2.357 2.357 0 00-4.715 0V40.5a.786.786 0 01-.785.786h-4.715a2.357 2.357 0 000 4.714h4.715a5.5 5.5 0 005.5-5.5v-4.714zM5.246 33.429a2.357 2.357 0 012.357 2.357V40.5a.786.786 0 00.786.786h4.714a2.357 2.357 0 010 4.714H8.389a5.5 5.5 0 01-5.5-5.5v-4.714a2.357 2.357 0 012.357-2.357zM36.674 2a2.357 2.357 0 000 4.714h4.715a.786.786 0 01.785.786v4.714a2.357 2.357 0 004.715 0V7.5a5.5 5.5 0 00-5.5-5.5h-4.715z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Iframe;

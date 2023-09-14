import React from 'react';

const Pagination = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M9.174 41.286A4.714 4.714 0 0013.89 46h22a4.714 4.714 0 004.714-4.714V13.38c0-1.25-.497-2.45-1.38-3.333L32.554 3.38A4.714 4.714 0 0029.222 2H13.889a4.714 4.714 0 00-4.715 4.714v34.572z"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M5.246 23.214a2.357 2.357 0 000 4.715h3.143a2.357 2.357 0 100-4.715H5.246zm12.048 0a2.357 2.357 0 000 4.715h3.142a2.357 2.357 0 100-4.715h-3.142zm9.69 2.357a2.357 2.357 0 012.357-2.357h3.143a2.357 2.357 0 010 4.715H29.34a2.357 2.357 0 01-2.357-2.358zm14.405-2.357a2.357 2.357 0 000 4.715h3.142a2.357 2.357 0 100-4.715H41.39z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Pagination;

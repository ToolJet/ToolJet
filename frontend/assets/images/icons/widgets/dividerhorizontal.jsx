import React from 'react';

const DividerHorizondal = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M2.889 16.964c0-2.603 1.558-4.714 3.48-4.714h14.038c1.922 0 3.48 2.11 3.48 4.714v14.572c0 2.603-1.558 4.714-3.48 4.714H6.37c-1.922 0-3.48-2.11-3.48-4.714V16.964zM25.893 16.964c0-2.603 1.558-4.714 3.48-4.714h14.034c1.922 0 3.48 2.11 3.48 4.714v14.572c0 2.603-1.558 4.714-3.48 4.714H29.373c-1.922 0-3.48-2.11-3.48-4.714V16.964z"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M36.429 27.393a3.143 3.143 0 100-6.286 3.143 3.143 0 000 6.286zM13.511 27.393a3.143 3.143 0 100-6.286 3.143 3.143 0 000 6.286z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default DividerHorizondal;

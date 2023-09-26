import React from 'react';

const Multiselect = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M13.889 8.8a4.714 4.714 0 014.714-4.715h23.571A4.714 4.714 0 0146.89 8.8v8.115a4.714 4.714 0 01-4.715 4.714H18.603a4.714 4.714 0 01-4.714-4.714V8.799zm0 22.286a4.714 4.714 0 014.714-4.714h23.571a4.714 4.714 0 014.715 4.714V39.2a4.714 4.714 0 01-4.715 4.715H18.603a4.714 4.714 0 01-4.714-4.715v-8.114z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M6.032 4.085a3.143 3.143 0 100 6.286 3.143 3.143 0 000-6.286zm0 22.287a3.143 3.143 0 100 6.286 3.143 3.143 0 000-6.286z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Multiselect;

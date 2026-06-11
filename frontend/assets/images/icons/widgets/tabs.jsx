import React from 'react';

const Tabs = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill="#3E63DD"
      d="M25.934 6.644V26.38a2 2 0 002 2H44.89a2 2 0 002-2V6.644a2 2 0 00-2-2H27.934a2 2 0 00-2 2z"
    ></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M9.174 5.143a6.286 6.286 0 00-6.285 6.285v25.143a6.286 6.286 0 006.285 6.286h31.429a6.286 6.286 0 006.286-6.286v-22H25.877L21.78 6.034a1.571 1.571 0 00-1.417-.891H9.174z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Tabs;

import React from 'react';

const Treeselect = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M22.532 26.357v11.786h4.714V26.357H37.46c.434 0 .786.352.786.786v11a2.357 2.357 0 104.714 0v-11a5.5 5.5 0 00-5.5-5.5H27.246V9.857h-4.714v11.786H12.317a5.5 5.5 0 00-5.5 5.5v11a2.357 2.357 0 004.715 0v-11c0-.434.351-.786.785-.786h10.215z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M31.174 9.859a6.286 6.286 0 11-12.571 0 6.286 6.286 0 0112.571 0zm-22 34.568a6.286 6.286 0 100-12.571 6.286 6.286 0 000 12.571zm15.715 0a6.286 6.286 0 100-12.571 6.286 6.286 0 000 12.571zm15.714 0a6.286 6.286 0 100-12.571 6.286 6.286 0 000 12.571z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Treeselect;

import React from 'react';

const Container = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill={fill} d="M41.389 7.5h-33v33h33v-33z"></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M9.174 14.571A6.286 6.286 0 109.174 2a6.286 6.286 0 000 12.571zm31.429 0a6.286 6.286 0 100-12.57 6.286 6.286 0 000 12.57zM15.46 39.714a6.286 6.286 0 11-12.571 0 6.286 6.286 0 0112.571 0zM40.603 46a6.286 6.286 0 100-12.571 6.286 6.286 0 000 12.571zM16.639 16.929c0-1.085.88-1.965 1.964-1.965h12.571a1.964 1.964 0 110 3.929H18.603a1.964 1.964 0 01-1.964-1.964zm0 7.071c0-1.085.88-1.964 1.964-1.964h12.571a1.964 1.964 0 010 3.928H18.603A1.964 1.964 0 0116.639 24zm1.964 5.107a1.964 1.964 0 100 3.929h12.571a1.964 1.964 0 000-3.929H18.603z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Container;

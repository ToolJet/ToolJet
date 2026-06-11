import React from 'react';

const Html = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M4.46 2a1.571 1.571 0 00-1.552 1.817l4.714 29.857c.067.421.302.797.651 1.042l15.715 11a1.572 1.572 0 001.802 0l15.714-11c.35-.245.585-.62.651-1.042L46.87 3.817A1.572 1.572 0 0045.317 2H4.46z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M14.536 10.004c.373-.455.93-.72 1.52-.72h17.666a1.964 1.964 0 110 3.93h-15.27l.98 4.904h12.523c1.085 0 1.965.88 1.965 1.965v8.833c0 .618-.291 1.2-.786 1.571l-7.067 5.3a1.964 1.964 0 01-2.357 0l-7.067-5.3A1.964 1.964 0 0119 27.345l5.889 4.416 5.102-3.827v-5.887h-12.17c-.936 0-1.742-.661-1.925-1.58l-1.767-8.833a1.964 1.964 0 01.407-1.63z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Html;

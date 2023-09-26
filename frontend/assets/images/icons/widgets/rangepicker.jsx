import React from 'react';

const RangePicker = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill={fill} d="M2.889 16.476V40.5a5.5 5.5 0 005.5 5.5h33a5.5 5.5 0 005.5-5.5V16.476h-44z"></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M13.889 2a3.143 3.143 0 013.143 3.143v1.571h15.714V5.143a3.143 3.143 0 016.286 0v1.571h2.357c2.788 0 5.5 2.08 5.5 5.174v4.604H2.889v-4.604c0-3.093 2.711-5.174 5.5-5.174h2.357V5.143A3.143 3.143 0 0113.889 2zM14.674 31.29a2.357 2.357 0 012.358-2.357h15.714a2.357 2.357 0 110 4.714H17.03a2.357 2.357 0 01-2.357-2.357z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default RangePicker;

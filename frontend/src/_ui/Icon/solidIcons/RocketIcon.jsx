import React from 'react';

const RocketIcon = ({ fill = '#C1C8CD', width = '16', className = '', viewBox = '0 0 16 16' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10.5 1.5C10.5 1.5 13.5 1.5 14.5 2.5C15.5 3.5 14.5 6.5 14.5 6.5L11 10L6 9L7 4L10.5 1.5Z"
      fill={fill}
      stroke={fill}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 9L2.5 12.5C2 13 2 13.5 2 14C2 14.5 2.5 15 3 15C3.5 15 4 15 4.5 14.5L8 11L6 9Z"
      fill={fill}
      stroke={fill}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10.5" cy="5.5" r="1" fill={fill === '#C1C8CD' ? '#FFFFFF' : 'currentColor'} />
    <path d="M4 10L1.5 10.5L1 14L4.5 13.5L4 10Z" fill={fill} />
  </svg>
);

export default RocketIcon;

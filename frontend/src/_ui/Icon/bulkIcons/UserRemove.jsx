import React from 'react';

const UserRemove = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <ellipse opacity="0.4" cx="10" cy="17" rx="7" ry="4" fill={fill} />
    <circle cx="10" cy="7" r="4" fill={fill} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.25 11C16.25 10.5858 16.5858 10.25 17 10.25H21C21.4142 10.25 21.75 10.5858 21.75 11C21.75 11.4142 21.4142 11.75 21 11.75H17C16.5858 11.75 16.25 11.4142 16.25 11Z"
      fill={fill}
    />
  </svg>
);

export default UserRemove;

import React from 'react';

const UserAdd = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M18.25 13C18.25 13.4142 18.5858 13.75 19 13.75C19.4142 13.75 19.75 13.4142 19.75 13V11.75H21C21.4142 11.75 21.75 11.4142 21.75 11C21.75 10.5858 21.4142 10.25 21 10.25H19.75V9C19.75 8.58579 19.4142 8.25 19 8.25C18.5858 8.25 18.25 8.58579 18.25 9L18.25 10.25H17C16.5858 10.25 16.25 10.5858 16.25 11C16.25 11.4142 16.5858 11.75 17 11.75H18.25L18.25 13Z"
      fill={fill}
    />
  </svg>
);

export default UserAdd;

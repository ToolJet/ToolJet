import React from 'react';

const UserGroup = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle opacity="0.4" cx="7.5" cy="8.5" r="2.5" fill={fill} />
    <circle opacity="0.4" cx="16.5" cy="8.5" r="2.5" fill={fill} />
    <ellipse opacity="0.4" cx="12" cy="16" rx="6" ry="3" fill={fill} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.4946 17.9874C17.4313 17.4582 17.9999 16.7623 17.9999 16C17.9999 14.813 16.6212 13.7871 14.6208 13.3006C15.3283 13.1089 16.1387 13 16.9999 13C19.7614 13 21.9999 14.1193 21.9999 15.5C21.9999 16.8807 19.7614 18 16.9999 18C16.8294 18 16.6608 17.9957 16.4946 17.9874Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.50534 17.9874C7.33916 17.9957 7.17058 18 7 18C4.23858 18 2 16.8807 2 15.5C2 14.1193 4.23858 13 7 13C7.86123 13 8.67161 13.1089 9.37908 13.3006C7.3787 13.7871 6 14.813 6 16C6 16.7623 6.56862 17.4582 7.50534 17.9874Z"
      fill={fill}
    />
    <circle cx="12" cy="8" r="3" fill={fill} />
  </svg>
);

export default UserGroup;

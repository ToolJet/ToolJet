import React from 'react';

const GitBranch = ({ fill = '#C1C8CD', width = '16', className = '', viewBox = '0 0 16 16' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 3C4 2.44772 4.44772 2 5 2C5.55228 2 6 2.44772 6 3C6 3.55228 5.55228 4 5 4C4.44772 4 4 3.55228 4 3ZM5 0C3.34315 0 2 1.34315 2 3C2 4.30622 2.83481 5.41746 4 5.82929V10.1707C2.83481 10.5825 2 11.6938 2 13C2 14.6569 3.34315 16 5 16C6.65685 16 8 14.6569 8 13C8 11.6938 7.16519 10.5825 6 10.1707V5.82929C7.16519 5.41746 8 4.30622 8 3C8 1.34315 6.65685 0 5 0ZM4 13C4 12.4477 4.44772 12 5 12C5.55228 12 6 12.4477 6 13C6 13.5523 5.55228 14 5 14C4.44772 14 4 13.5523 4 13Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 7C9.34315 7 8 8.34315 8 10C8 11.6569 9.34315 13 11 13C12.6569 13 14 11.6569 14 10C14 8.34315 12.6569 7 11 7ZM6 10C6 7.23858 8.23858 5 11 5C13.7614 5 16 7.23858 16 10C16 12.7614 13.7614 15 11 15C8.23858 15 6 12.7614 6 10Z"
      fill={fill}
    />
  </svg>
);

export default GitBranch;

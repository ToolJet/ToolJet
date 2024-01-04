import React from 'react';

const Information = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle opacity="0.4" cx="12" cy="12" r="10" fill={fill} />
    <path
      d="M13 7C13 7.55228 12.5523 8 12 8C11.4477 8 11 7.55228 11 7C11 6.44772 11.4477 6 12 6C12.5523 6 13 6.44772 13 7Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.25 10C10.25 9.58579 10.5858 9.25 11 9.25H12C12.4142 9.25 12.75 9.58579 12.75 10V17C12.75 17.4142 12.4142 17.75 12 17.75C11.5858 17.75 11.25 17.4142 11.25 17V10.75H11C10.5858 10.75 10.25 10.4142 10.25 10Z"
      fill={fill}
    />
  </svg>
);

export default Information;

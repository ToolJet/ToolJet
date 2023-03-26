import React from 'react';

const Comments = ({ fill = '#C1C8CD', width = '25', className = 'tj-icon', viewBox = '0 0 25 25', onClick }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    onClick={onClick}
    className={className}
  >
    <path
      opacity="0.4"
      d="M13 3H11C6.02944 3 2 7.02944 2 12V17C2 19.2091 3.79086 21 6 21H13C17.9706 21 22 16.9706 22 12C22 7.02944 17.9706 3 13 3Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.25 14C7.25 14.4142 7.58579 14.75 8 14.75H12C12.4142 14.75 12.75 14.4142 12.75 14C12.75 13.5858 12.4142 13.25 12 13.25H8C7.58579 13.25 7.25 13.5858 7.25 14ZM7.25 10C7.25 10.4142 7.58579 10.75 8 10.75H16C16.4142 10.75 16.75 10.4142 16.75 10C16.75 9.58579 16.4142 9.25 16 9.25H8C7.58579 9.25 7.25 9.58579 7.25 10Z"
      fill={fill}
    />
  </svg>
);

export default Comments;

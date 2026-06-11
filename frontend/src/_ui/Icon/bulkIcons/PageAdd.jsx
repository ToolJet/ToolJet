import React from 'react';

const PageAdd = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      opacity="0.4"
      d="M3 6L3 18C3 20.2091 4.79086 22 7 22H13L21 14V6C21 3.79086 19.2091 2 17 2L7 2C4.79086 2 3 3.79086 3 6Z"
      fill={fill}
    />
    <path d="M13 18L13 22L21 14L17 14C14.7909 14 13 15.7909 13 18Z" fill={fill} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.25 7C7.25 6.58579 7.58579 6.25 8 6.25L16 6.25C16.4142 6.25 16.75 6.58579 16.75 7C16.75 7.41421 16.4142 7.75 16 7.75L8 7.75C7.58579 7.75 7.25 7.41421 7.25 7Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.25 12C7.25 11.5858 7.58579 11.25 8 11.25H12C12.4142 11.25 12.75 11.5858 12.75 12C12.75 12.4142 12.4142 12.75 12 12.75H8C7.58579 12.75 7.25 12.4142 7.25 12Z"
      fill={fill}
    />
  </svg>
);

export default PageAdd;

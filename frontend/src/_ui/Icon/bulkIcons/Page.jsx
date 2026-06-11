import React from 'react';

const Page = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V8.25H15C15.4142 8.25 15.75 8.58579 15.75 9C15.75 9.41421 15.4142 9.75 15 9.75H12.75V12C12.75 12.4142 12.4142 12.75 12 12.75C11.5858 12.75 11.25 12.4142 11.25 12V9.75H9C8.58579 9.75 8.25 9.41421 8.25 9C8.25 8.58579 8.58579 8.25 9 8.25H11.25V6C11.25 5.58579 11.5858 5.25 12 5.25Z"
      fill={fill}
    />
  </svg>
);

export default Page;

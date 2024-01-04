import React from 'react';

const CommentsNotification = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M13 4H11C6.02944 4 2 8.02944 2 13V18C2 20.2091 3.79086 22 6 22H13C17.9706 22 22 17.9706 22 13C22 8.02944 17.9706 4 13 4Z"
      fill={fill}
    />
    <path
      d="M22 6C22 8.20914 20.2091 10 18 10C15.7909 10 14 8.20914 14 6C14 3.79086 15.7909 2 18 2C20.2091 2 22 3.79086 22 6Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.25 11C7.25 10.5858 7.58579 10.25 8 10.25H12C12.4142 10.25 12.75 10.5858 12.75 11C12.75 11.4142 12.4142 11.75 12 11.75H8C7.58579 11.75 7.25 11.4142 7.25 11ZM7.25 15C7.25 14.5858 7.58579 14.25 8 14.25H16C16.4142 14.25 16.75 14.5858 16.75 15C16.75 15.4142 16.4142 15.75 16 15.75H8C7.58579 15.75 7.25 15.4142 7.25 15Z"
      fill={fill}
    />
  </svg>
);

export default CommentsNotification;

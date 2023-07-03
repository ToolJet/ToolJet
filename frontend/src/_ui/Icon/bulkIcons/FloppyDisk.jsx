import React from 'react';

const FloppyDisk = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy="floppy-icon"
  >
    <path
      opacity="0.4"
      d="M2 6C2 3.79086 3.79086 2 6 2H14.7876C15.8485 2 16.8659 2.42143 17.616 3.17157L20.8284 6.38398C21.5786 7.13413 22 8.15154 22 9.21241V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6Z"
      fill={fill}
    />
    <path d="M7 16V22H17V16C17 14.8954 16.1046 14 15 14H9C7.89543 14 7 14.8954 7 16Z" fill={fill} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.75 7C15.75 7.41421 15.4142 7.75 15 7.75L9 7.75C8.58579 7.75 8.25 7.41421 8.25 7C8.25 6.58579 8.58579 6.25 9 6.25L15 6.25C15.4142 6.25 15.75 6.58579 15.75 7Z"
      fill={fill}
    />
  </svg>
);

export default FloppyDisk;

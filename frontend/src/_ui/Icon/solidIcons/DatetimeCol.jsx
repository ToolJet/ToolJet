import React from 'react';

const DatetimeCol = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path opacity="0.4" d="M3 9H21V18C21 20.2091 19.2091 22 17 22H7C4.79086 22 3 20.2091 3 18V9Z" fill={fill} />
    <path d="M17 3.5H7C4.79086 3.5 3 5.29086 3 7.5V9H21V7.5C21 5.29086 19.2091 3.5 17 3.5Z" fill={fill} />
    <path
      opacity="0.4"
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M8 1.25C8.41421 1.25 8.75 1.58579 8.75 2V5C8.75 5.41421 8.41421 5.75 8 5.75C7.58579 5.75 7.25 5.41421 7.25 5V2C7.25 1.58579 7.58579 1.25 8 1.25ZM16 1.25C16.4142 1.25 16.75 1.58579 16.75 2V5C16.75 5.41421 16.4142 5.75 16 5.75C15.5858 5.75 15.25 5.41421 15.25 5V2C15.25 1.58579 15.5858 1.25 16 1.25Z"
      fill={fill}
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M18 23C20.7614 23 23 20.7614 23 18C23 15.2386 20.7614 13 18 13C15.2386 13 13 15.2386 13 18C13 20.7614 15.2386 23 18 23ZM18 14.625C17.7929 14.625 17.625 14.7929 17.625 15V17.0727C17.2585 17.221 17 17.5803 17 18C17 18.5523 17.4477 19 18 19C18.5523 19 19 18.5523 19 18C19 17.5803 18.7415 17.221 18.375 17.0727V15C18.375 14.7929 18.2071 14.625 18 14.625Z"
      fill={fill}
    />
  </svg>
);

export default DatetimeCol;

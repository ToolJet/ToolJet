import React from 'react';

const Computer = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M11.25 18V21.25H9C8.58579 21.25 8.25 21.5858 8.25 22C8.25 22.4142 8.58579 22.75 9 22.75H15C15.4142 22.75 15.75 22.4142 15.75 22C15.75 21.5858 15.4142 21.25 15 21.25H12.75V18H11.25Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V15C22 16.6569 20.6569 18 19 18H5C3.34315 18 2 16.6569 2 15V5Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.25 15C10.25 14.5858 10.5858 14.25 11 14.25H13C13.4142 14.25 13.75 14.5858 13.75 15C13.75 15.4142 13.4142 15.75 13 15.75H11C10.5858 15.75 10.25 15.4142 10.25 15Z"
      fill={fill}
    />
  </svg>
);

export default Computer;

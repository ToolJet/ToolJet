import React from 'react';

const ZoomOutRectangle = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M6 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6C2 3.79086 3.79086 2 6 2Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13 8.75C12.5858 8.75 12.25 8.41421 12.25 8C12.25 7.58579 12.5858 7.25 13 7.25H16C16.4142 7.25 16.75 7.58579 16.75 8V11C16.75 11.4142 16.4142 11.75 16 11.75C15.5858 11.75 15.25 11.4142 15.25 11V9.81066L9.81066 15.25H11C11.4142 15.25 11.75 15.5858 11.75 16C11.75 16.4142 11.4142 16.75 11 16.75H8C7.58579 16.75 7.25 16.4142 7.25 16V13C7.25 12.5858 7.58579 12.25 8 12.25C8.41421 12.25 8.75 12.5858 8.75 13V14.1893L14.1893 8.75H13Z"
      fill={fill}
    />
  </svg>
);

export default ZoomOutRectangle;

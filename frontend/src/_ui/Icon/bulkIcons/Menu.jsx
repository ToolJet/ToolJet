import React from 'react';

const Menu = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.25 8C6.25 7.58579 6.58579 7.25 7 7.25H17C17.4142 7.25 17.75 7.58579 17.75 8C17.75 8.41421 17.4142 8.75 17 8.75H7C6.58579 8.75 6.25 8.41421 6.25 8Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.25 12C6.25 11.5858 6.58579 11.25 7 11.25H17C17.4142 11.25 17.75 11.5858 17.75 12C17.75 12.4142 17.4142 12.75 17 12.75H7C6.58579 12.75 6.25 12.4142 6.25 12Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.25 16C6.25 15.5858 6.58579 15.25 7 15.25H17C17.4142 15.25 17.75 15.5858 17.75 16C17.75 16.4142 17.4142 16.75 17 16.75H7C6.58579 16.75 6.25 16.4142 6.25 16Z"
      fill={fill}
    />
  </svg>
);

export default Menu;

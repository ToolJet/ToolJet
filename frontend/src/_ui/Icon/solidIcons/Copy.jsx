import React from 'react';

const Copy = ({ fill = '#C1C8CD', width = '25', className = 'tj-icon', viewBox = '0 0 25 25', onClick }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    onClick={onClick}
    className={className}
    data-cy="copy-icon"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.1429 7.28906H8.5V6.78906C8.5 4.57992 10.2909 2.78906 12.5 2.78906H18.5C20.7091 2.78906 22.5 4.57992 22.5 6.78906V12.7891C22.5 14.9982 20.7091 16.7891 18.5 16.7891H18V12.1462C18 9.46368 15.8254 7.28906 13.1429 7.28906ZM12.5 22.7891H6.5C4.29086 22.7891 2.5 20.9982 2.5 18.7891V12.7891C2.5 10.5799 4.29086 8.78906 6.5 8.78906H12.5C14.7091 8.78906 16.5 10.5799 16.5 12.7891V18.7891C16.5 20.9982 14.7091 22.7891 12.5 22.7891Z"
      fill={fill}
    />
  </svg>
);

export default Copy;

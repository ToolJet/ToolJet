import React from 'react';

const ClearRectangle = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M18.5 2.78906H6.5C4.29086 2.78906 2.5 4.57992 2.5 6.78906V18.7891C2.5 20.9982 4.29086 22.7891 6.5 22.7891H18.5C20.7091 22.7891 22.5 20.9982 22.5 18.7891V6.78906C22.5 4.57992 20.7091 2.78906 18.5 2.78906ZM16.5 13.5391C16.9142 13.5391 17.25 13.2033 17.25 12.7891C17.25 12.3748 16.9142 12.0391 16.5 12.0391H8.5C8.08579 12.0391 7.75 12.3748 7.75 12.7891C7.75 13.2033 8.08579 13.5391 8.5 13.5391H16.5Z"
      fill={fill}
    />
  </svg>
);

export default ClearRectangle;

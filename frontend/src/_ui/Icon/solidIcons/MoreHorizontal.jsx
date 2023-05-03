import React from 'react';

const MoreHorizontal = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M7 12.0391C7 12.7294 7.55964 13.2891 8.25 13.2891C8.94036 13.2891 9.5 12.7294 9.5 12.0391C9.5 11.3487 8.94036 10.7891 8.25 10.7891C7.55964 10.7891 7 11.3487 7 12.0391ZM13.25 13.2891C12.5596 13.2891 12 12.7294 12 12.0391C12 11.3487 12.5596 10.7891 13.25 10.7891C13.9404 10.7891 14.5 11.3487 14.5 12.0391C14.5 12.7294 13.9404 13.2891 13.25 13.2891ZM18.25 13.2891C17.5596 13.2891 17 12.7294 17 12.0391C17 11.3487 17.5596 10.7891 18.25 10.7891C18.9404 10.7891 19.5 11.3487 19.5 12.0391C19.5 12.7294 18.9404 13.2891 18.25 13.2891Z"
      fill={fill}
    />
  </svg>
);

export default MoreHorizontal;

import React from 'react';

const Minus = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M19.25 12.7891C19.25 13.2033 18.9142 13.5391 18.5 13.5391L6.5 13.5391C6.08579 13.5391 5.75 13.2033 5.75 12.7891C5.75 12.3748 6.08579 12.0391 6.5 12.0391L18.5 12.0391C18.9142 12.0391 19.25 12.3748 19.25 12.7891Z"
      fill={fill}
    />
  </svg>
);

export default Minus;

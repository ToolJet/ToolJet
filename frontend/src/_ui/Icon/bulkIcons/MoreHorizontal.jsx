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
      d="M12.75 12.5C12.0596 12.5 11.5 11.9404 11.5 11.25C11.5 10.5596 12.0596 10 12.75 10C13.4404 10 14 10.5596 14 11.25C14 11.9404 13.4404 12.5 12.75 12.5Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      d="M17.25 12.5C16.5596 12.5 16 11.9404 16 11.25C16 10.5596 16.5596 10 17.25 10C17.9404 10 18.5 10.5596 18.5 11.25C18.5 11.9404 17.9404 12.5 17.25 12.5Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      d="M7.75 12.5C7.05964 12.5 6.5 11.9404 6.5 11.25C6.5 10.5596 7.05964 10 7.75 10C8.44036 10 9 10.5596 9 11.25C9 11.9404 8.44036 12.5 7.75 12.5Z"
      fill={fill}
    />
  </svg>
);

export default MoreHorizontal;

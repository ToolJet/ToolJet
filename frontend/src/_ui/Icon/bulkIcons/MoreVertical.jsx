import React from 'react';

const MoreVertical = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12.5 11.25C12.5 11.9404 11.9404 12.5 11.25 12.5C10.5596 12.5 10 11.9404 10 11.25C10 10.5596 10.5596 10 11.25 10C11.9404 10 12.5 10.5596 12.5 11.25Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      d="M12.5 6.25C12.5 6.94036 11.9404 7.5 11.25 7.5C10.5596 7.5 10 6.94036 10 6.25C10 5.55964 10.5596 5 11.25 5C11.9404 5 12.5 5.55964 12.5 6.25Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      d="M12.5 16.25C12.5 16.9404 11.9404 17.5 11.25 17.5C10.5596 17.5 10 16.9404 10 16.25C10 15.5596 10.5596 15 11.25 15C11.9404 15 12.5 15.5596 12.5 16.25Z"
      fill={fill}
    />
  </svg>
);

export default MoreVertical;

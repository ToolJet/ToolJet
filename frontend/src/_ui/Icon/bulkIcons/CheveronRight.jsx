import React from 'react';

const CheveronRight = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    className={className}
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.53154 6.41422C9.20809 6.67298 9.15565 7.14495 9.41441 7.4684L13.0396 11.9999L9.41441 16.5314C9.15565 16.8548 9.20809 17.3268 9.53154 17.5855C9.85498 17.8443 10.327 17.7918 10.5857 17.4684L14.5857 12.4684C14.8048 12.1945 14.8048 11.8053 14.5857 11.5314L10.5857 6.53135C10.327 6.20791 9.85498 6.15547 9.53154 6.41422Z"
      fill={fill}
    />
  </svg>
);

export default CheveronRight;

import React from 'react';

const CheveronLeft = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24' }) => (
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
      d="M14.4685 6.41431C14.792 6.67307 14.8444 7.14504 14.5857 7.46849L10.9605 12L14.5857 16.5314C14.8444 16.8549 14.792 17.3269 14.4685 17.5856C14.1451 17.8444 13.6731 17.7919 13.4144 17.4685L9.41437 12.4685C9.19523 12.1946 9.19524 11.8054 9.41437 11.5314L13.4144 6.53145C13.6731 6.208 14.1451 6.15556 14.4685 6.41431Z"
      fill={fill}
    />
  </svg>
);

export default CheveronLeft;

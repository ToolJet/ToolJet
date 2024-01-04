import React from 'react';

const CheveronUp = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24' }) => (
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
      d="M17.5857 14.4684C17.3269 14.7919 16.855 14.8443 16.5315 14.5856L12 10.9604L7.46857 14.5856C7.14512 14.8443 6.67315 14.7919 6.4144 14.4684C6.15564 14.145 6.20808 13.673 6.53153 13.4143L11.5315 9.41426C11.8054 9.19513 12.1947 9.19513 12.4686 9.41426L17.4686 13.4143C17.792 13.673 17.8445 14.145 17.5857 14.4684Z"
      fill={fill}
    />
  </svg>
);

export default CheveronUp;

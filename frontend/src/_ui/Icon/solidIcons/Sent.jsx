import React from 'react';

const Sent = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg width={width} height={width} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.8894 3.78906H5.11094C2.83933 3.78906 1.6554 6.42455 3.1962 8.0514L6.28568 11.3135C6.73 11.7826 6.97673 12.3976 6.97673 13.0361V19.2444C6.97673 21.6626 10.1161 22.7124 11.6394 20.8036L21.9463 7.888C23.2775 6.21977 22.0578 3.78906 19.8894 3.78906Z"
      fill={fill}
      className={className}
    />
  </svg>
);

export default Sent;

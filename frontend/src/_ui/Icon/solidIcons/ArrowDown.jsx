import React from 'react';

const ArrowDown = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M11.9697 19.3194C12.2626 19.6123 12.7374 19.6123 13.0303 19.3194L17.0303 15.3194C17.3232 15.0265 17.3232 14.5516 17.0303 14.2587C16.7374 13.9658 16.2626 13.9658 15.9697 14.2587L13.25 16.9784V6.78906C13.25 6.37485 12.9142 6.03906 12.5 6.03906C12.0858 6.03906 11.75 6.37485 11.75 6.78906V16.9784L9.03033 14.2587C8.73744 13.9658 8.26256 13.9658 7.96967 14.2587C7.67678 14.5516 7.67678 15.0265 7.96967 15.3194L11.9697 19.3194Z"
      fill={fill}
    />
  </svg>
);

export default ArrowDown;

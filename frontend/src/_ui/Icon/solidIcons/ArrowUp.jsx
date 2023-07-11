import React from 'react';

const ArrowUp = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M11.9697 6.25873C12.2626 5.96584 12.7374 5.96584 13.0303 6.25873L17.0303 10.2587C17.3232 10.5516 17.3232 11.0265 17.0303 11.3194C16.7374 11.6123 16.2626 11.6123 15.9697 11.3194L13.25 8.59972V18.7891C13.25 19.2033 12.9142 19.5391 12.5 19.5391C12.0858 19.5391 11.75 19.2033 11.75 18.7891V8.59972L9.03033 11.3194C8.73744 11.6123 8.26256 11.6123 7.96967 11.3194C7.67678 11.0265 7.67678 10.5516 7.96967 10.2587L11.9697 6.25873Z"
      fill={fill}
    />
  </svg>
);

export default ArrowUp;

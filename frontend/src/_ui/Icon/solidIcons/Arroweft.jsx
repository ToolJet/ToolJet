import React from 'react';

const Arroweft = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M5.96967 12.2587C5.67678 12.5516 5.67678 13.0265 5.96967 13.3194L9.96967 17.3194C10.2626 17.6123 10.7374 17.6123 11.0303 17.3194C11.3232 17.0265 11.3232 16.5516 11.0303 16.2587L8.31066 13.5391L18.5 13.5391C18.9142 13.5391 19.25 13.2033 19.25 12.7891C19.25 12.3748 18.9142 12.0391 18.5 12.0391L8.31066 12.0391L11.0303 9.31939C11.3232 9.0265 11.3232 8.55163 11.0303 8.25873C10.7374 7.96584 10.2626 7.96584 9.96967 8.25873L5.96967 12.2587Z"
      fill={fill}
    />
  </svg>
);

export default Arroweft;

import React from 'react';

const Information = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25', style }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy="information-icon"
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22.5 12.7891C22.5 18.3119 18.0228 22.7891 12.5 22.7891C6.97715 22.7891 2.5 18.3119 2.5 12.7891C2.5 7.26621 6.97715 2.78906 12.5 2.78906C18.0228 2.78906 22.5 7.26621 22.5 12.7891ZM13.5 7.78906C13.5 8.34135 13.0523 8.78906 12.5 8.78906C11.9477 8.78906 11.5 8.34135 11.5 7.78906C11.5 7.23678 11.9477 6.78906 12.5 6.78906C13.0523 6.78906 13.5 7.23678 13.5 7.78906ZM11.5 10.0391C11.0858 10.0391 10.75 10.3748 10.75 10.7891C10.75 11.2033 11.0858 11.5391 11.5 11.5391H11.75V17.7891C11.75 18.2033 12.0858 18.5391 12.5 18.5391C12.9142 18.5391 13.25 18.2033 13.25 17.7891V10.7891C13.25 10.3748 12.9142 10.0391 12.5 10.0391H11.5Z"
      fill={fill}
    />
  </svg>
);

export default Information;

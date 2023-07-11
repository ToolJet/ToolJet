import React from 'react';

const Warning = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      opacity="0.4"
      d="M9.96798 4.16592C10.8536 2.61136 13.1464 2.61136 14.032 4.16592L21.7041 17.6324C22.5649 19.1433 21.4445 21 19.6721 21H4.32789C2.55546 21 1.4351 19.1433 2.29587 17.6324L9.96798 4.16592Z"
      fill={fill}
    />
    <path
      d="M13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 8.25C12.4142 8.25 12.75 8.58579 12.75 9V14C12.75 14.4142 12.4142 14.75 12 14.75C11.5858 14.75 11.25 14.4142 11.25 14V9C11.25 8.58579 11.5858 8.25 12 8.25Z"
      fill={fill}
    />
  </svg>
);

export default Warning;

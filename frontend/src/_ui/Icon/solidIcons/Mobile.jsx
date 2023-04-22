import React from 'react';

const Mobiles = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M8.5 2.78906C6.84315 2.78906 5.5 4.13221 5.5 5.78906V19.7891C5.5 21.4459 6.84315 22.7891 8.5 22.7891H16.5C18.1569 22.7891 19.5 21.4459 19.5 19.7891V5.78906C19.5 4.13221 18.1569 2.78906 16.5 2.78906H8.5ZM11.5 19.0391C11.0858 19.0391 10.75 19.3748 10.75 19.7891C10.75 20.2033 11.0858 20.5391 11.5 20.5391H13.5C13.9142 20.5391 14.25 20.2033 14.25 19.7891C14.25 19.3748 13.9142 19.0391 13.5 19.0391H11.5Z"
      fill={fill}
    />
  </svg>
);

export default Mobiles;

import React from 'react';

const Tick = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.5018 6.44254C19.8096 6.71963 19.8346 7.19385 19.5575 7.50173L11.8199 16.0991C10.8454 17.1819 9.19549 17.3168 8.05793 16.4068L4.53151 13.5857C4.20806 13.3269 4.15562 12.8549 4.41438 12.5315C4.67313 12.208 5.1451 12.1556 5.46855 12.4144L8.99497 15.2355C9.51204 15.6492 10.262 15.5878 10.705 15.0956L18.4426 6.49828C18.7197 6.1904 19.1939 6.16544 19.5018 6.44254Z"
      fill={fill}
    />
  </svg>
);

export default Tick;

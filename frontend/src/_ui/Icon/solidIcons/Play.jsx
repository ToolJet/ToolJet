import React from 'react';

const Play = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M17.4611 14.5255L9.49228 19.0792C8.15896 19.8411 6.5 18.8783 6.5 17.3427V12.7891V8.23542C6.5 6.69978 8.15896 5.73704 9.49228 6.49894L17.4611 11.0526C18.8048 11.8204 18.8048 13.7578 17.4611 14.5255Z"
      fill={fill}
    />
  </svg>
);

export default Play;

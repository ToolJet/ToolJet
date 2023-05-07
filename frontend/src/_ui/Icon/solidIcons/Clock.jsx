import React from 'react';

const Clock = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M6.5 2.78906C4.29086 2.78906 2.5 4.57992 2.5 6.78906V18.7891C2.5 20.9982 4.29086 22.7891 6.5 22.7891H18.5C20.7091 22.7891 22.5 20.9982 22.5 18.7891V6.78906C22.5 4.57992 20.7091 2.78906 18.5 2.78906H6.5ZM13.25 7.78906C13.25 7.37485 12.9142 7.03906 12.5 7.03906C12.0858 7.03906 11.75 7.37485 11.75 7.78906V12.7891C11.75 13.1119 11.9566 13.3985 12.2628 13.5006L15.2628 14.5006C15.6558 14.6316 16.0805 14.4192 16.2115 14.0262C16.3425 13.6333 16.1301 13.2085 15.7372 13.0775L13.25 12.2485V7.78906Z"
      fill={fill}
    />
  </svg>
);

export default Clock;

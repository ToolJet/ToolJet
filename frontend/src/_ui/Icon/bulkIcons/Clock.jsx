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
      opacity="0.4"
      d="M2 6C2 3.79086 3.79086 2 6 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 7.27173C12.4142 7.27173 12.75 7.60751 12.75 8.02173V12.4812L15.2372 13.3102C15.6301 13.4412 15.8425 13.8659 15.7115 14.2589C15.5805 14.6519 15.1558 14.8642 14.7628 14.7332L11.7628 13.7332C11.4566 13.6312 11.25 13.3446 11.25 13.0217V8.02173C11.25 7.60751 11.5858 7.27173 12 7.27173Z"
      fill={fill}
    />
  </svg>
);

export default Clock;

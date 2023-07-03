import React from 'react';

const Minus01 = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M18.5 10.7891C19.6046 10.7891 20.5 11.6845 20.5 12.7891C20.5 13.8936 19.6046 14.7891 18.5 14.7891L6.5 14.7891C5.39543 14.7891 4.5 13.8936 4.5 12.7891C4.5 11.6845 5.39543 10.7891 6.5 10.7891L18.5 10.7891Z"
      fill={fill}
    />
  </svg>
);

export default Minus01;

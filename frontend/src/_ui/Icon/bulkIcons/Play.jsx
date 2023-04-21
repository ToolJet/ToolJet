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
      opacity="0.4"
      d="M16.9611 13.7364L8.99228 18.2901C7.65896 19.052 6 18.0892 6 16.5536V7.44631C6 5.91067 7.65896 4.94793 8.99228 5.70983L16.9611 10.2635C18.3048 11.0313 18.3048 12.9687 16.9611 13.7364Z"
      fill={fill}
    />
  </svg>
);

export default Play;

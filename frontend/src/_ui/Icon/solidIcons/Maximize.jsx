import React from 'react';

function Maximize({ stroke = '#C1C8CD', width = '25', viewBox = '0 0 25 25', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={width}
      fill="none"
      viewBox={viewBox}
      style={style}
    >
      <path
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8.5 1H13m0 0v4.5M13 1L1 13m0 0V8.5M1 13h4.5"
      ></path>
    </svg>
  );
}

export default Maximize;

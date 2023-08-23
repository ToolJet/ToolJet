import React from 'react';

function Minimize({ stroke = '#C1C8CD', width = '25', viewBox = '0 0 25 25' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={width}
      fill="none"
      viewBox={viewBox}
    >
      <path
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M17 1l-7 7m-9 9l7-7m2-2h5m-5 0V3m-2 7v5m0-5H3"
      ></path>
    </svg>
  );
}

export default Minimize;

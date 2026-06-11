import React from 'react';

const ArrowDownTriangle = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24', style = {} }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
    style={style}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.20923 10.7525C9.00495 10.4589 8.94384 10.0173 9.05439 9.63373C9.16495 9.25012 9.4254 9 9.7143 9H18.2857C18.5746 9 18.835 9.25012 18.9456 9.63373C19.0562 10.0173 18.995 10.4589 18.7907 10.7525L14.7576 16.5491C14.3392 17.1503 13.6608 17.1503 13.2424 16.5491L9.20923 10.7525Z"
      fill={fill}
    />
  </svg>
);

export default ArrowDownTriangle;

import React from 'react';

const Row = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M2.5 18.7891C2.5 20.9982 4.29086 22.7891 6.5 22.7891H18.5C20.7091 22.7891 22.5 20.9982 22.5 18.7891V17.5391H2.5V18.7891ZM2.5 16.0391H22.5V6.78906C22.5 4.57992 20.7091 2.78906 18.5 2.78906H6.5C4.29086 2.78906 2.5 4.57992 2.5 6.78906V16.0391Z"
      fill={fill}
    />
  </svg>
);

export default Row;

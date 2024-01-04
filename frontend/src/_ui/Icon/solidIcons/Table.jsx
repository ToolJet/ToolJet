import React from 'react';

const Table = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg width={width} height={width} viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 6.78906C2.5 4.57992 4.29086 2.78906 6.5 2.78906H18.5C20.7091 2.78906 22.5 4.57992 22.5 6.78906V8.03906H8.5H2.5V6.78906ZM2.5 9.53906V18.7891C2.5 20.9982 4.29086 22.7891 6.5 22.7891H7.75V15.7891V9.53906H2.5ZM9.25 22.7891H18.5C20.7091 22.7891 22.5 20.9982 22.5 18.7891V16.5391L9.25 16.5391V22.7891ZM22.5 15.0391V9.53906L9.25 9.53906V15.0391L22.5 15.0391Z"
      fill={fill}
      className={className}
    />
  </svg>
);

export default Table;

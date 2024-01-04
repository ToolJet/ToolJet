import React from 'react';

const Columns = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6 2H18C20.2091 2 22 3.79086 22 6V8L15 8V22H9V8H2V6C2 3.79086 3.79086 2 6 2Z" fill="#121212" />
    <g opacity="0.4">
      <path d="M22 18C22 20.2091 20.2091 22 18 22H15V8H22V18Z" fill={fill} />
      <path d="M6 22C3.79086 22 2 20.2091 2 18V8H9V22H6Z" fill={fill} />
    </g>
  </svg>
);

export default Columns;

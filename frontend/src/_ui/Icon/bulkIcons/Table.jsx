import React from 'react';

const Table = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy="table-icon"
  >
    <g opacity="0.4">
      <path d="M22 18C22 20.2091 20.2091 22 18 22H8V8H22V18Z" fill={fill} />
    </g>
    <path d="M8 15H22V18C22 20.2091 20.2091 22 18 22H8V15Z" fill={fill} />
    <path d="M6 2H18C20.2091 2 22 3.79086 22 6V8L2 8V6C2 3.79086 3.79086 2 6 2Z" fill={fill} />
    <g opacity="0.4">
      <path d="M6 22C3.79086 22 2 20.2091 2 18V8H8V22H6Z" fill={fill} />
    </g>
  </svg>
);

export default Table;

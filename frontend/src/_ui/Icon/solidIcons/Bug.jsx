import React from 'react';

const Bug = ({ fill = '#000', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    fill={fill}
    height={width}
    viewBox={viewBox}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  ></svg>
);

export default Bug;

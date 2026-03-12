import React from 'react';

const MarkerCircle = ({ fill = '#CCD1D5', width = '18', className = '', viewBox = '0 0 18 18' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
  >
    <circle cx="8.99999" cy="8.66656" r="5.21905" stroke={fill} />
    <circle cx="9.00003" cy="8.66641" r="2.80801" fill={fill} />
  </svg>
);

export default MarkerCircle;

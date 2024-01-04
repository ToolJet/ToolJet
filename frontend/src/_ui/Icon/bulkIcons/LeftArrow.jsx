import React from 'react';

const LeftArrow = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g opacity="0.4">
      <path
        d="M17 15.5179V8.48202C17 6.93844 15.3256 5.97669 13.9923 6.75446L7.96153 10.2724C6.63852 11.0441 6.63852 12.9557 7.96153 13.7275L13.9923 17.2454C15.3256 18.0232 17 17.0615 17 15.5179Z"
        fill={fill}
      />
    </g>
  </svg>
);

export default LeftArrow;

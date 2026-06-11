import React from 'react';

const TriangleUpCenter = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24', style }) => (
  <svg
    className={className}
    width={width}
    height={width}
    viewBox={viewBox}
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M16.9908 10.7525C17.1951 10.4589 17.2562 10.0173 17.1456 9.63373C17.0351 9.25012 16.7746 9 16.4857 9H7.91433C7.62541 9 7.36498 9.25012 7.25441 9.63373C7.14384 10.0173 7.20498 10.4589 7.40926 10.7525L11.4424 16.5491C11.8608 17.1503 12.5392 17.1503 12.9576 16.5491L16.9908 10.7525Z"
      fill={fill}
    />
  </svg>
);

export default TriangleUpCenter;

import React from 'react';

const Refresh = ({ fill = '#C1C8CD', width = '14', className = '', viewBox = '0 0 14 14' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M13.65 6.35C13.5 3.5 11.25 1.25 8.4 1.1V0L6.3 2.1L8.4 4.2V3.1C10.15 3.25 11.5 4.65 11.65 6.35H13.65ZM5.6 9.8V10.9C3.85 10.75 2.5 9.35 2.35 7.65H0.35C0.5 10.5 2.75 12.75 5.6 12.9V14L7.7 11.9L5.6 9.8Z"
      fill={fill}
    />
  </svg>
);

export default Refresh;

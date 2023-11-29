import React from 'react';

const Tick = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25', style }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20.0018 7.2316C20.3096 7.50869 20.3346 7.98291 20.0575 8.29079L12.3199 16.8881C11.3454 17.9709 9.69549 18.1059 8.55793 17.1959L5.03151 14.3747C4.70806 14.116 4.65562 13.644 4.91438 13.3205C5.17313 12.9971 5.6451 12.9447 5.96855 13.2034L9.49497 16.0246C10.012 16.4382 10.762 16.3769 11.205 15.8847L18.9426 7.28735C19.2197 6.97946 19.6939 6.9545 20.0018 7.2316Z"
      fill={fill}
    />
  </svg>
);

export default Tick;

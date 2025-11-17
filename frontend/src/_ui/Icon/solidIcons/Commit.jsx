import React from 'react';

const Commit = ({ fill = 'var(--icon-default)', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8M10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8M10 8H14M6 8H2"
      stroke={fill}
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export default Commit;

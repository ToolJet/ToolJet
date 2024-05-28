import React from 'react';

const TriangleUpArrow = ({ fill = 'var(--icons-default)', width = '25', className = '', viewBox = '0 0 16 16' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={width}
    viewBox={viewBox}
    className={className}
    fill="none"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.5272 8.83152C12.6634 9.02725 12.7041 9.32162 12.6304 9.57735C12.5567 9.83309 12.3831 9.99984 12.1905 9.99984L6.47621 9.99984C6.28359 9.99984 6.10998 9.83309 6.03626 9.57735C5.96255 9.32162 6.00331 9.02725 6.1395 8.83152L8.82826 4.96714C9.1072 4.56629 9.55946 4.56629 9.83841 4.96714L12.5272 8.83152Z"
      fill={fill}
    />
  </svg>
);

export default TriangleUpArrow;

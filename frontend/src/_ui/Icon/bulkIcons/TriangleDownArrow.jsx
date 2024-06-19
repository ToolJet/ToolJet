import React from 'react';

const TriangleDownArrow = ({ fill = 'var(--icons-default)', width = '25', className = '', viewBox = '0 0 16 16' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={width}
      viewBox={viewBox}
      fill="none"
      className={className}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M6.13949 7.16832C6.0033 6.97259 5.96256 6.67822 6.03626 6.42249C6.10997 6.16674 6.2836 6 6.4762 6H12.1905C12.3831 6 12.5567 6.16674 12.6304 6.42249C12.7041 6.67822 12.6634 6.97259 12.5272 7.16832L9.83841 11.0327C9.55946 11.4335 9.10721 11.4335 8.82826 11.0327L6.13949 7.16832Z"
        fill={fill}
      />
    </svg>
  );
};

export default TriangleDownArrow;

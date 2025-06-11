import React from 'react';

const BooleanTypeIcon = ({ fill = '#ACB2B9', width = '16', className = '', viewBox = '0 0 16 16', style, height }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.6673 8.00007C14.6673 5.63314 12.7486 3.71436 10.3816 3.71436H5.6197C3.25277 3.71436 1.33398 5.63314 1.33398 8.00007C1.33398 10.367 3.25277 12.2858 5.6197 12.2858H10.3816C12.7486 12.2858 14.6673 10.367 14.6673 8.00007ZM5.6197 9.90483C6.67167 9.90483 7.52446 9.05204 7.52446 8.00007C7.52446 6.9481 6.67167 6.09531 5.6197 6.09531C4.56773 6.09531 3.71494 6.9481 3.71494 8.00007C3.71494 9.05204 4.56773 9.90483 5.6197 9.90483Z"
      fill={fill}
    />
  </svg>
);

export default BooleanTypeIcon;

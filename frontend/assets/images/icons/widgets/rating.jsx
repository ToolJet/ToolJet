import React from 'react';

const Rating = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill={fill} d="M24.889 46c12.15 0 22-9.85 22-22s-9.85-22-22-22-22 9.85-22 22 9.85 22 22 22z"></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M27.101 13.284l-1.395.722 1.407-.7 2.553 5.137 5.66.86a2.482 2.482 0 011.358 4.27l-3.942 3.746.831 5.85a2.482 2.482 0 01-3.658 2.612l-5.026-2.66-5.026 2.66a2.485 2.485 0 01-3.532-1.268 2.482 2.482 0 01-.122-1.368l.96-5.702-4.084-3.91-.032-.03a2.484 2.484 0 011.37-4.196l.024-.004 5.665-.83 2.547-5.123a2.482 2.482 0 014.442-.066z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Rating;

import React from 'react';

const PlusIcon = ({ fill = '#C1C8CD', width = '14', className = '', viewBox = '0 0 14 14' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7 0C7.27614 0 7.5 0.223858 7.5 0.5V6.5H13.5C13.7761 6.5 14 6.72386 14 7C14 7.27614 13.7761 7.5 13.5 7.5H7.5V13.5C7.5 13.7761 7.27614 14 7 14C6.72386 14 6.5 13.7761 6.5 13.5V7.5H0.5C0.223858 7.5 0 7.27614 0 7C0 6.72386 0.223858 6.5 0.5 6.5H6.5V0.5C6.5 0.223858 6.72386 0 7 0Z"
      fill={fill}
    />
  </svg>
);

export default PlusIcon;

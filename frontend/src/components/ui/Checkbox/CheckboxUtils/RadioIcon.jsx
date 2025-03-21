import React from 'react';

const RadioIcon = ({ size }) => {
  const className = size === 'large' ? 'tw-h-[20px] tw-w-[20px]' : 'tw-h-[16px] tw-w-[16px]';
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="-3 -4 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="4" r="3" fill="white" />
    </svg>
  );
};

export default RadioIcon;

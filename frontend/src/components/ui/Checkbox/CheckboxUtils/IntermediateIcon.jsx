import React from 'react';

const IntermediateIcon = ({ size }) => {
  const className = size === 'large' ? 'tw-h-[20px] tw-w-[20px]' : 'tw-h-[16px] tw-w-[16px]';
  return (
    <svg className={className} width="8" height="2" viewBox="-2 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.984375 1C0.984375 0.723858 1.20823 0.5 1.48438 0.5H6.51547C6.79162 0.5 7.01547 0.723858 7.01547 1C7.01547 1.27614 6.79162 1.5 6.51547 1.5H1.48438C1.20823 1.5 0.984375 1.27614 0.984375 1Z"
        fill="#FBFCFD"
      />
    </svg>
  );
};

export default IntermediateIcon;

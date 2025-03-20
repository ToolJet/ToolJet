import React from 'react';

const CheckIcon = ({ size, fill = 'white' }) => {
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.93064 0.811811C9.20532 1.03656 9.24581 1.44146 9.02106 1.71616L4.64307 7.12414C3.98209 8.00969 3.34866 7.75601 2.80188 7.27755L1.05248 5.74684C0.785368 5.5131 0.758301 5.10709 0.992027 4.83998C1.22575 4.57286 1.63177 4.54579 1.89888 4.77952L3.64828 6.31027L8.02628 0.902247C8.25102 0.627539 8.6559 0.58705 8.93064 0.811811Z"
        fill={fill}
      />
    </svg>
  );
};

export default CheckIcon;

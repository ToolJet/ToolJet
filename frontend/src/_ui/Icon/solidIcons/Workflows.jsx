import React from 'react';

export default function Workflows({ fill = 'none' }) {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.00016 0.083313L12.7501 2.16665V6.33331L9.00016 8.41665L5.25012 6.33331V2.16665L9.00016 0.083313Z"
        fill={fill}
      />
      <path
        d="M4.41679 7.58331L8.16675 9.66665V13.8333L4.41679 15.9166L0.666748 13.8333V9.66665L4.41679 7.58331Z"
        fill={fill}
      />
      <path
        d="M17.3334 9.66665L13.5835 7.58331L9.83342 9.66665V13.8333L13.5835 15.9166L17.3334 13.8333V9.66665Z"
        fill={fill}
      />
    </svg>
  );
}

import React from 'react';

const CaretDown = ({ fill = '#C1C8CD', width = '16', className = '', viewBox = '0 0 16 16' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox={viewBox} fill="none">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.3271 7.16832C11.4633 6.97259 11.504 6.67822 11.4303 6.42249C11.3566 6.16674 11.183 6 10.9903 6H5.2761C5.08348 6 4.90986 6.16674 4.83615 6.42249C4.76244 6.67822 4.8032 6.97259 4.93939 7.16832L7.62814 11.0327C7.90709 11.4335 8.35935 11.4335 8.63829 11.0327L11.3271 7.16832Z"
      fill={fill}
    />
  </svg>
);

export default CaretDown;

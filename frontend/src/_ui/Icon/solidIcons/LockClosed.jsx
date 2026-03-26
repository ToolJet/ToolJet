import React from 'react';

const LockClosed = ({ fill = '#C1C8CD', width = '16', className = '', viewBox = '0 0 16 16' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12.6667 7.33333H12V5.33333C12 3.49238 10.5076 2 8.66667 2C6.82572 2 5.33333 3.49238 5.33333 5.33333V7.33333H4.66667C3.93029 7.33333 3.33333 7.93029 3.33333 8.66667V12.6667C3.33333 13.403 3.93029 14 4.66667 14H12.6667C13.403 14 14 13.403 14 12.6667V8.66667C14 7.93029 13.403 7.33333 12.6667 7.33333ZM6.66667 5.33333C6.66667 4.22876 7.56209 3.33333 8.66667 3.33333C9.77124 3.33333 10.6667 4.22876 10.6667 5.33333V7.33333H6.66667V5.33333Z"
      fill={fill}
    />
  </svg>
);

export default LockClosed;

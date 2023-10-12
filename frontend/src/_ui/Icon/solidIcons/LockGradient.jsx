import React from 'react';

const LockGradient = ({ width = '16', height = '16', className = '' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.83341 4.84733C5.83341 3.65071 6.80346 2.68066 8.00008 2.68066C9.1967 2.68066 10.1667 3.65071 10.1667 4.84733V5.68066H5.83341V4.84733ZM4.83341 5.72746V4.84733C4.83341 3.09843 6.25118 1.68066 8.00008 1.68066C9.74898 1.68066 11.1667 3.09843 11.1667 4.84733V5.72746C12.4005 5.9615 13.3334 7.04547 13.3334 8.34733V12.3473C13.3334 13.8201 12.1395 15.014 10.6667 15.014H5.33341C3.86066 15.014 2.66675 13.8201 2.66675 12.3473V8.34733C2.66675 7.04547 3.59965 5.9615 4.83341 5.72746ZM9.33341 10.3473C9.33341 11.0837 8.73646 11.6807 8.00008 11.6807C7.2637 11.6807 6.66675 11.0837 6.66675 10.3473C6.66675 9.61095 7.2637 9.014 8.00008 9.014C8.73646 9.014 9.33341 9.61095 9.33341 10.3473Z"
      fill="url(#paint0_linear_6464_4587)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_6464_4587"
        x1="1.58499"
        y1="-6.98601"
        x2="15.0411"
        y2="-5.83604"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FF5F6D" />
        <stop offset="1" stop-color="#FFC371" />
      </linearGradient>
    </defs>
  </svg>
);

export default LockGradient;

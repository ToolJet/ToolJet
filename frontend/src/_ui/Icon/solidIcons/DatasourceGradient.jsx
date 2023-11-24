import React from 'react';

const DatasourceGradient = ({ width = '16', height = '16', className = '' }) => (
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
      d="M14.6666 5.94941V12.3473C14.6666 13.8201 13.4727 15.014 12 15.014H3.99998C2.52722 15.014 1.33331 13.8201 1.33331 12.3473V5.94941C1.33331 5.80276 1.3454 5.65716 1.3691 5.514H14.6309C14.6546 5.65716 14.6666 5.80276 14.6666 5.94941ZM10.6666 12.514C10.3905 12.514 10.1666 12.7379 10.1666 13.014C10.1666 13.2901 10.3905 13.514 10.6666 13.514H12.6666C12.9428 13.514 13.1666 13.2901 13.1666 13.014C13.1666 12.7379 12.9428 12.514 12.6666 12.514H10.6666ZM10.1666 11.014C10.1666 10.7379 10.3905 10.514 10.6666 10.514H12.6666C12.9428 10.514 13.1666 10.7379 13.1666 11.014C13.1666 11.2901 12.9428 11.514 12.6666 11.514H10.6666C10.3905 11.514 10.1666 11.2901 10.1666 11.014Z"
      fill="url(#paint0_linear_6464_801)"
    />
    <path
      d="M14.2474 4.514C14.1967 4.43462 14.1416 4.35768 14.0823 4.28356L12.8006 2.68148C12.2946 2.0489 11.5284 1.68066 10.7183 1.68066H5.28165C4.47156 1.68066 3.70539 2.0489 3.19933 2.68148L1.91766 4.28356C1.85837 4.35768 1.8033 4.43462 1.7526 4.514H14.2474Z"
      fill="url(#paint1_linear_6464_801)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_6464_801"
        x1="-0.018888"
        y1="-6.98601"
        x2="16.7329"
        y2="-5.19648"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FF5F6D" />
        <stop offset="1" stopColor="#FFC371" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_6464_801"
        x1="-0.018888"
        y1="-6.98601"
        x2="16.7329"
        y2="-5.19648"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FF5F6D" />
        <stop offset="1" stopColor="#FFC371" />
      </linearGradient>
    </defs>
  </svg>
);

export default DatasourceGradient;

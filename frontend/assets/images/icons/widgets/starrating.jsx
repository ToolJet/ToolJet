import React from 'react';

const Starrating = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M2.88867 24C2.88867 22.6982 3.944 21.6428 5.24581 21.6428H44.5315C45.8333 21.6428 46.8887 22.6982 46.8887 24C46.8887 25.3018 45.8333 26.3571 44.5315 26.3571H5.24581C3.944 26.3571 2.88867 25.3018 2.88867 24Z"
      fill={fill}
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M2.88867 24C2.88867 22.6982 3.944 21.6428 5.24581 21.6428H29.3421C30.6438 21.6428 31.6992 22.6982 31.6992 24C31.6992 25.3018 30.6438 26.3571 29.3421 26.3571H5.24581C3.944 26.3571 2.88867 25.3018 2.88867 24Z"
      fill="#3E63DD"
    />
    <rect x="27.7549" y="17.1086" width="5.45898" height="13.7825" rx="2.72949" fill="#3E63DD" />
  </svg>
);

export default Starrating;

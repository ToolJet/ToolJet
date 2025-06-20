import React from 'react';

const ArrowRight01 = ({ fill = '#C1C8CD', width = '12', className = '', viewBox = '0 0 12 12' }) => (
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
      d="M8.2908 3.20921C8.01186 2.93026 7.5596 2.93026 7.28065 3.20921C7.0017 3.48816 7.0017 3.94042 7.28065 4.21937L8.5613 5.5H1.71429C1.3198 5.5 1 5.8198 1 6.21429C1 6.60878 1.3198 6.92858 1.71429 6.92858H8.5613L7.28065 8.20922C7.0017 8.48815 7.0017 8.94044 7.28065 9.21937C7.5596 9.4983 8.01186 9.4983 8.2908 9.21937L10.7908 6.71937C11.0697 6.44042 11.0697 5.98816 10.7908 5.70921L8.2908 3.20921Z"
      fill={fill}
    />
  </svg>
);

export default ArrowRight01;

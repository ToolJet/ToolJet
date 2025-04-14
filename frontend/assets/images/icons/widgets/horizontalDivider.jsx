import React from 'react';

const HorizontalDivider = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox={viewBox} fill="none">
    <g clip-path="url(#clip0_0_153)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M0.888672 23.7143C0.888672 21.9785 2.29578 20.5714 4.03153 20.5714H41.7458C43.4816 20.5714 44.8887 21.9785 44.8887 23.7143C44.8887 25.45 43.4816 26.8571 41.7458 26.8571H4.03153C2.29578 26.8571 0.888672 25.45 0.888672 23.7143Z"
        fill="#CCD1D5"
      />
      <circle cx="22.8887" cy="23.7144" r="5.15332" fill="#4368E3" />
    </g>
    <defs>
      <clipPath id="clip0_0_153">
        <rect width="48" height="48" fill="white" transform="translate(0.888672)" />
      </clipPath>
    </defs>
  </svg>
);

export default HorizontalDivider;

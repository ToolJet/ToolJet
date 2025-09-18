import React from 'react';
const AITopup = ({ fill = 'none', width = '12', height = '12', className = '', viewBox = '0 0 12 12' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
      <g clip-path="url(#clip0_11154_9640)">
        <path
          d="M10.6673 5.46924H6.66732C6.3137 5.46924 5.97456 5.60971 5.72451 5.85976C5.47446 6.10981 5.33398 6.44895 5.33398 6.80257C5.33398 7.15619 5.47446 7.49533 5.72451 7.74538C5.97456 7.99543 6.3137 8.13591 6.66732 8.13591H9.33398C9.68761 8.13591 10.0267 8.27638 10.2768 8.52643C10.5268 8.77648 10.6673 9.11562 10.6673 9.46924C10.6673 9.82286 10.5268 10.162 10.2768 10.412C10.0267 10.6621 9.68761 10.8026 9.33398 10.8026H5.33398M8.00065 12.1359V4.13591M14.6673 8.13591C14.6673 11.8178 11.6826 14.8026 8.00065 14.8026C4.31875 14.8026 1.33398 11.8178 1.33398 8.13591C1.33398 4.45401 4.31875 1.46924 8.00065 1.46924C11.6826 1.46924 14.6673 4.45401 14.6673 8.13591Z"
          stroke="url(#paint0_linear_11154_9640)"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_11154_9640"
          x1="8.00065"
          y1="14.8026"
          x2="8.00065"
          y2="1.46924"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FC5F70" />
          <stop offset="1" stop-color="#8E4EC6" />
        </linearGradient>
        <clipPath id="clip0_11154_9640">
          <rect width="16" height="16" fill="white" transform="translate(0 0.135986)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default AITopup;

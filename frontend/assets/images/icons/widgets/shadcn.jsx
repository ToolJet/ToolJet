import React from 'react';

// shadcn/ui pack (experiment): palette icons for the pack's components that have no native counterpart. Same
// two-tone treatment and 24px frame as the native and Ant Design icons.
const IconFrame = ({ width = 24, className = '', children }) => (
  <svg
    width={width}
    height={width}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const AreaChartIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <path d="M2 21V14l5-5 4 3 5-6 6 4v11H2Z" fill={fill} />
    <path d="m2 14 5-5 4 3 5-6 6 4" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </IconFrame>
);

export const BarChartIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <rect x="3" y="12" width="4" height="9" rx="1" fill={fill} />
    <rect x="10" y="4" width="4" height="17" rx="1" fill="#3E63DD" />
    <rect x="17" y="8" width="4" height="13" rx="1" fill={fill} />
  </IconFrame>
);

export const PieChartIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <path d="M11 3a9 9 0 1 0 10 10H11V3Z" fill={fill} />
    <path d="M13 1a10 10 0 0 1 10 10H13V1Z" fill="#3E63DD" />
  </IconFrame>
);

export const SkeletonIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <circle cx="5.5" cy="6.5" r="3.5" fill="#3E63DD" />
    <rect x="11" y="4" width="11" height="2.5" rx="1.25" fill={fill} />
    <rect x="11" y="8" width="7" height="2.5" rx="1.25" fill={fill} />
    <rect x="2" y="14" width="20" height="2.5" rx="1.25" fill={fill} />
    <rect x="2" y="18.5" width="14" height="2.5" rx="1.25" fill={fill} />
  </IconFrame>
);

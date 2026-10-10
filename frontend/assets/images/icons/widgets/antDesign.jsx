import React from 'react';

// Match the native widget icons' two-tone treatment and sizing contract.
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

export const CardIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <rect x="2" y="3" width="20" height="18" rx="3" fill={fill} />
    <path d="M2 6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3H2V6Z" fill="#3E63DD" />
    <path d="M6 13h12M6 17h8" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" />
  </IconFrame>
);

export const HeadingIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <rect x="2" y="19" width="20" height="3" rx="1.5" fill={fill} />
    <path d="M5 3v12M15 3v12M5 9h10" stroke="#3E63DD" strokeWidth="3" strokeLinecap="round" />
    <path d="m19 9 2-1v7" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </IconFrame>
);

export const DescriptionsIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <rect x="2" y="3" width="20" height="18" rx="3" fill={fill} />
    <path d="M6 7h3M6 12h3M6 17h3M13 7h5M13 12h5M13 17h5" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" />
  </IconFrame>
);

export const BadgeIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <rect x="2" y="7" width="17" height="14" rx="3" fill={fill} />
    <path d="M6 13h9M6 17h6" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" />
    <circle cx="18" cy="6" r="4" fill="#3E63DD" />
  </IconFrame>
);

export const AvatarIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <circle cx="12" cy="12" r="10" fill={fill} />
    <circle cx="12" cy="8" r="3.5" fill="#3E63DD" />
    <path d="M5.5 19a6.5 6.5 0 0 1 13 0 10 10 0 0 1-13 0Z" fill="#3E63DD" />
  </IconFrame>
);

export const EmptyIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <path d="m3 10 4-6h10l4 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z" fill={fill} />
    <path d="M3 11h5l2 3h4l2-3h5" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 2h6" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" />
  </IconFrame>
);

export const AlertIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <path d="M10.3 3.4a2 2 0 0 1 3.4 0l8 14.6a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3l8-14.6Z" fill={fill} />
    <path d="M12 8v6" stroke="#3E63DD" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="17.5" r="1.3" fill="#3E63DD" />
  </IconFrame>
);

export const BreadcrumbIcon = ({ fill = '#D7DBDF', ...props }) => (
  <IconFrame {...props}>
    <rect x="1" y="8" width="5" height="8" rx="1.5" fill={fill} />
    <rect x="11" y="8" width="5" height="8" rx="1.5" fill={fill} />
    <path d="m8 9 2 3-2 3m10-6 2 3-2 3" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 9v6" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" />
  </IconFrame>
);

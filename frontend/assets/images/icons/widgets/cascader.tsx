import React from 'react';

interface CascaderIconProps {
  fill?: string;
  width?: number;
  className?: string;
  viewBox?: string;
}

const Cascader = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }: CascaderIconProps) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Input field */}
    <rect x="6" y="8" width="37" height="10" rx="3" fill={fill} />
    {/* Dropdown panel */}
    <rect x="6" y="22" width="37" height="20" rx="3" fill={fill} fillOpacity="0.5" />
    {/* Level rows */}
    <rect x="10" y="27" width="16" height="3" rx="1.5" fill={fill} />
    <rect x="10" y="34" width="16" height="3" rx="1.5" fill={fill} />
    {/* Drilldown chevron + selected leaf accent */}
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M29.5 26.6l4 2.9-4 2.9V26.6z"
      clipRule="evenodd"
    />
    <rect x="29" y="34" width="10" height="3" rx="1.5" fill="#3E63DD" />
  </svg>
);

export default Cascader;

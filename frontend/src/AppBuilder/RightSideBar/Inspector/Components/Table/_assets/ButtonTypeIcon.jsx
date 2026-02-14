import React from 'react';

const ButtonTypeIcon = ({ fill = '#ACB2B9', width = '16', className = '', viewBox = '0 0 16 16', style, height }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <rect x="1.5" y="4.5" width="13" height="7" rx="2" stroke={fill} strokeWidth="1.2" />
    <path
      d="M5.5 8H10.5"
      stroke={fill}
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export default ButtonTypeIcon;

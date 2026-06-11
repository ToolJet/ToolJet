import React from 'react';

const Shield = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy="shield-icon"
  >
    <path
      opacity="0.4"
      d="M10.3754 2.7221L5.37755 4.94335C3.93193 5.58585 2.97794 7.02469 3.06993 8.60398C3.42956 14.7782 5.23761 17.4963 9.93573 20.677C11.1803 21.5196 12.8209 21.5217 14.0646 20.6777C18.7771 17.4797 20.5205 14.7232 20.9117 8.62537C21.0137 7.03564 20.0582 5.58152 18.6025 4.93454L13.6245 2.7221C12.5902 2.26242 11.4096 2.26242 10.3754 2.7221Z"
      fill={fill}
    />
    <circle cx="12" cy="12" r="3" fill={fill} />
  </svg>
);

export default Shield;

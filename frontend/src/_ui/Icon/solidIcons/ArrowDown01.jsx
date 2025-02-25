import React from 'react';

const ArrowDown01 = ({ width = '24', fill = '#6A727C', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.5714 3.42857C13.5714 2.63959 12.9318 2 12.1429 2C11.3539 2 10.7143 2.63959 10.7143 3.42857V17.1226L7.43873 13.847C6.88083 13.2891 5.97632 13.2891 5.41842 13.847C4.86053 14.4049 4.86053 15.3094 5.41842 15.8673L11.1327 21.5816C11.6906 22.1395 12.5951 22.1395 13.153 21.5816L18.8673 15.8673C19.4252 15.3094 19.4252 14.4049 18.8673 13.847C18.3095 13.2891 17.4049 13.2891 16.847 13.847L13.5714 17.1226V3.42857Z"
      fill={fill}
    />
  </svg>
);

export default ArrowDown01;

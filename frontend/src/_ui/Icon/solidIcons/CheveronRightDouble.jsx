import React from 'react';
const CheveronRightDouble = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    className={className}
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.7496 6.41438C11.4261 6.67313 11.3737 7.1451 11.6324 7.46855L15.2576 12L11.6324 16.5315C11.3737 16.855 11.4261 17.3269 11.7496 17.5857C12.073 17.8444 12.545 17.792 12.8037 17.4685L16.8037 12.4685C17.0229 12.1946 17.0229 11.8054 16.8037 11.5315L12.8037 6.53151C12.545 6.20806 12.073 6.15562 11.7496 6.41438Z"
      fill={fill}
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.31337 6.41438C6.98992 6.67313 6.93748 7.1451 7.19624 7.46855L10.8214 12L7.19624 16.5315C6.93748 16.855 6.98992 17.3269 7.31337 17.5857C7.63681 17.8444 8.10878 17.792 8.36754 17.4685L12.3675 12.4685C12.5867 12.1946 12.5867 11.8054 12.3675 11.5315L8.36754 6.53151C8.10878 6.20806 7.63681 6.15562 7.31337 6.41438Z"
      fill={fill}
    />
  </svg>
);

export default CheveronRightDouble;

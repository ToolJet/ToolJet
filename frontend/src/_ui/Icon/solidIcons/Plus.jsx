import React from 'react';

const Plus = ({ fill = '#C1C8CD', width = '14', className = '', viewBox = '0 0 14 14', style, dataCy }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy={dataCy}
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.83335 2C7.83335 1.53976 7.46025 1.16667 7.00002 1.16667C6.53979 1.16667 6.16669 1.53976 6.16669 2V6.16667H2.00002C1.53978 6.16667 1.16669 6.53977 1.16669 7C1.16669 7.46023 1.53978 7.83333 2.00002 7.83333H6.16669V12C6.16669 12.4602 6.53979 12.8333 7.00002 12.8333C7.46025 12.8333 7.83335 12.4602 7.83335 12V7.83333H12C12.4603 7.83333 12.8334 7.46023 12.8334 7C12.8334 6.53977 12.4603 6.16667 12 6.16667H7.83335V2Z"
      fill={fill}
    />
  </svg>
);

export default Plus;

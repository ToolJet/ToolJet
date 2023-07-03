import React from 'react';

const Unlock = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.18449 4.37554C9.74756 3.40216 10.7981 2.75 12.0002 2.75C13.7951 2.75 15.2502 4.20507 15.2502 6V8H16C16.2564 8 16.5072 8.02412 16.7502 8.07023V6C16.7502 3.37665 14.6235 1.25 12.0002 1.25C10.241 1.25 8.70624 2.20663 7.88608 3.62446C7.67867 3.983 7.80119 4.4418 8.15974 4.6492C8.51828 4.85661 8.97708 4.73409 9.18449 4.37554Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      d="M4 12C4 9.79086 5.79086 8 8 8H16C18.2091 8 20 9.79086 20 12V18C20 20.2091 18.2091 22 16 22H8C5.79086 22 4 20.2091 4 18V12Z"
      fill={fill}
    />
    <circle cx="12" cy="15" r="2" fill={fill} />
  </svg>
);

export default Unlock;

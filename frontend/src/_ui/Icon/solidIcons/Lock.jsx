<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>;

import React from 'react';

const Lock = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M9.25 6.75C9.25 4.95507 10.7051 3.5 12.5 3.5C14.2949 3.5 15.75 4.95507 15.75 6.75V8H9.25V6.75ZM7.75 8.0702V6.75C7.75 4.12665 9.87665 2 12.5 2C15.1234 2 17.25 4.12665 17.25 6.75V8.0702C19.1006 8.42125 20.5 10.0472 20.5 12V18C20.5 20.2091 18.7091 22 16.5 22H8.5C6.29086 22 4.5 20.2091 4.5 18V12C4.5 10.0472 5.89935 8.42125 7.75 8.0702ZM14.5 15C14.5 16.1046 13.6046 17 12.5 17C11.3954 17 10.5 16.1046 10.5 15C10.5 13.8954 11.3954 13 12.5 13C13.6046 13 14.5 13.8954 14.5 15Z"
      fill={fill}
    />
  </svg>
);

export default Lock;

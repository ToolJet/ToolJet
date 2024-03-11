import React from 'react';

const Options = ({ fill = '#11181C', height = '13', width = '12', className = '', viewBox = '0 0 13 12' }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 2.94092C5 2.38863 5.44772 1.94092 6 1.94092C6.55228 1.94092 7 2.38863 7 2.94092C7 3.4932 6.55228 3.94092 6 3.94092C5.44772 3.94092 5 3.4932 5 2.94092ZM5 6.44092C5 5.88863 5.44772 5.44092 6 5.44092C6.55228 5.44092 7 5.88863 7 6.44092C7 6.9932 6.55228 7.44092 6 7.44092C5.44772 7.44092 5 6.9932 5 6.44092ZM5 9.94092C5 9.38863 5.44772 8.94092 6 8.94092C6.55228 8.94092 7 9.38863 7 9.94092C7 10.4932 6.55228 10.9409 6 10.9409C5.44772 10.9409 5 10.4932 5 9.94092Z"
      fill={fill}
    />
  </svg>
);

export default Options;

import React from 'react';

const Map = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      fillRule="evenodd"
      d="M24.889 2c-12.15 0-22 9.85-22 22s9.85 22 22 22 22-9.85 22-22-9.85-22-22-22z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M33.978 14.91c.371.372.532.905.43 1.42l-2.31 11.546-.017-.017L21.03 16.807l-.017-.017 11.546-2.309a1.571 1.571 0 011.42.43zm-16.299 5.214L15.37 31.67a1.571 1.571 0 001.85 1.849l11.546-2.31a2.709 2.709 0 01-.017-.017L17.696 20.142l-.017-.017z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Map;

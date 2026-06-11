import React from 'react';

const Layers = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M11.27 3.065a2.75 2.75 0 012.46 0l7.317 3.659c1.29.645 1.29 2.485 0 3.13l-7.317 3.659a2.75 2.75 0 01-2.46 0L3.953 9.854c-1.29-.645-1.29-2.485 0-3.13l7.317-3.659zM2.815 17.984a.75.75 0 01.99-.38l8.187 3.639a1.25 1.25 0 001.016 0l8.187-3.64a.75.75 0 01.61 1.371l-8.188 3.64a2.75 2.75 0 01-2.234 0l-8.188-3.64a.75.75 0 01-.38-.99z"
    ></path>
    <path
      fill="#11181C"
      d="M3.805 13.104a.75.75 0 00-.61 1.37l8.188 3.64a2.75 2.75 0 002.234 0l8.188-3.64a.75.75 0 00-.61-1.37l-8.187 3.639a1.25 1.25 0 01-1.016 0l-8.187-3.64z"
    ></path>
  </svg>
);

export default Layers;

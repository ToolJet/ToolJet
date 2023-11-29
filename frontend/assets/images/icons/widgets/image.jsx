import React from 'react';

const Image = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M42.174 46a4.714 4.714 0 004.715-4.714V6.714A4.714 4.714 0 0042.174 2H7.603a4.714 4.714 0 00-4.714 4.714v34.572A4.714 4.714 0 007.603 46h34.571z"
    ></path>
    <path
      fill="#3E63DD"
      d="M33.931 20.235a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM9.86 26.31c4.719-.115 9.347 1.575 13.056 4.811 3.033 2.646 5.292 6.187 6.505 10.188H8.365a.786.786 0 01-.785-.785V26.427c.736-.08 1.476-.12 2.216-.117h.064zM42.198 40.64c0 .37-.3.67-.668.67h-7.22a27.408 27.408 0 00-3.684-8.445 29.238 29.238 0 017.677-1.008c1.305 0 2.608.087 3.895.26v8.524z"
    ></path>
  </svg>
);

export default Image;

import React from 'react';

const Texteditor = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M26.46 5.143a2.357 2.357 0 012.357-2.357h15.715a2.357 2.357 0 010 4.714H28.817a2.357 2.357 0 01-2.357-2.357zm2.357 7.071a2.357 2.357 0 000 4.714h15.715a2.357 2.357 0 100-4.714H28.817zM26.46 24a2.357 2.357 0 012.357-2.357h15.715a2.357 2.357 0 110 4.714H28.817A2.357 2.357 0 0126.46 24zM2.89 33.428a2.357 2.357 0 012.357-2.357H44.53a2.357 2.357 0 110 4.715H5.247a2.357 2.357 0 01-2.357-2.358zM5.246 40.5a2.357 2.357 0 000 4.714H44.53a2.357 2.357 0 000-4.714H5.247z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M13.889 7.882l-2.492 7.475h4.983L13.89 7.882zm7.98 9.035L18.193 5.888a4.537 4.537 0 00-8.609 0L5.908 16.917a2.333 2.333 0 00-.035.103l-2.078 6.235a2.357 2.357 0 104.473 1.49l1.558-4.674h8.126l1.558 4.674a2.357 2.357 0 004.472-1.49l-2.078-6.235a2.176 2.176 0 00-.035-.103z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Texteditor;

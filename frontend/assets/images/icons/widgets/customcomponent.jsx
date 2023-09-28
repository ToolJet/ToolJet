import React from 'react';

const Customcomponent = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M34.977 3.55l-8.314 16.632a1.898 1.898 0 001.697 2.747h16.629a1.898 1.898 0 001.697-2.747L38.371 3.549c-.699-1.399-2.695-1.399-3.394 0zM2.89 5.643c0-.867.703-1.571 1.571-1.571h15.714c.868 0 1.572.704 1.572 1.571V21.36c0 .868-.704 1.571-1.572 1.571H4.46A1.571 1.571 0 012.89 21.36V5.644zM12.317 46.5a9.429 9.429 0 100-18.857 9.429 9.429 0 000 18.857z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M29.603 27.643a2.357 2.357 0 100 4.714h14.143a2.357 2.357 0 100-4.714H29.603zm-2.357 9.428a2.357 2.357 0 012.357-2.357h14.143a2.357 2.357 0 010 4.715H29.603a2.357 2.357 0 01-2.357-2.358zm0 7.072a2.357 2.357 0 012.357-2.357h14.143a2.357 2.357 0 010 4.714H29.603a2.357 2.357 0 01-2.357-2.357z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Customcomponent;

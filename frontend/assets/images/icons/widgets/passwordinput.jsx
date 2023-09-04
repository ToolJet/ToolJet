import React from 'react';

const Passwordinput = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M2.889 15a4.714 4.714 0 014.714-4.714h34.571A4.714 4.714 0 0146.89 15v15.714a4.714 4.714 0 01-4.715 4.715H7.603a4.714 4.714 0 01-4.714-4.715V15z"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M12.882 22.857a3.15 3.15 0 11-6.3 0 3.15 3.15 0 016.3 0zm11 0a3.15 3.15 0 11-6.3 0 3.15 3.15 0 016.3 0zm7.064 1.179a1.964 1.964 0 100 3.928h6.286a1.964 1.964 0 000-3.928h-6.286z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Passwordinput;

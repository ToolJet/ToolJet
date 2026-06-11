import React from 'react';

const Filepicker = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill="#3E63DD"
      d="M31.174 33.428a3.143 3.143 0 01-3.142 3.143h-22a3.143 3.143 0 01-3.143-3.142V5.142A3.143 3.143 0 016.032 2h12.84c.834 0 1.634.331 2.223.92l9.159 9.16c.59.589.92 1.388.92 2.222v19.127z"
    ></path>
    <path
      fill={fill}
      d="M46.889 42.857A3.143 3.143 0 0143.746 46h-22a3.143 3.143 0 01-3.143-3.143V14.571a3.143 3.143 0 013.143-3.142h12.841c.833 0 1.633.33 2.222.92l9.16 9.16c.588.588.92 1.388.92 2.221v19.127z"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M35.103 24a2.357 2.357 0 10-4.714 0v3.928H26.46a2.357 2.357 0 000 4.715h3.929v3.928a2.357 2.357 0 004.714 0v-3.928h3.929a2.357 2.357 0 100-4.715h-3.929V24z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Filepicker;

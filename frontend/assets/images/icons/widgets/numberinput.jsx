import React from 'react';

const Numberinput = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M7.603 9.857a4.714 4.714 0 00-4.714 4.715v18.857a4.714 4.714 0 004.714 4.714h34.571a4.714 4.714 0 004.715-4.714V14.57a4.714 4.714 0 00-4.715-4.714H7.603z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M17.425 18.266a1.964 1.964 0 00-3.929 0 .903.903 0 01-.902.903h-.956a1.964 1.964 0 000 3.928h.956c.308 0 .61-.029.902-.084v4.757h-1.858a1.964 1.964 0 000 3.928h7.646a1.964 1.964 0 000-3.928h-1.859v-9.504zm9.04 9.504a1.964 1.964 0 000 3.928h5.45a1.964 1.964 0 000-3.928h-5.45z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Numberinput;

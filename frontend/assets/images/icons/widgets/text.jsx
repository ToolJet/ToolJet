import React from 'react';

const Text = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      d="M18.341 6.714c-.842 0-1.577.574-1.78 1.39L11.538 28.19h6.802a2.357 2.357 0 110 4.715h-7.98L7.532 44.213a2.357 2.357 0 11-4.573-1.144L6.22 30.023l.025-.1 5.74-22.962a6.55 6.55 0 0112.71 0l1.66 6.645a2.357 2.357 0 01-4.573 1.144l-1.661-6.645a1.836 1.836 0 00-1.781-1.39z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      fillRule="evenodd"
      d="M34.71 23.084a.393.393 0 00-.372.265l-3.53 10.297h7.804l-3.53-10.297a.393.393 0 00-.372-.265zm9.413 12.103L39.54 21.82a5.107 5.107 0 00-9.661 0l-4.583 13.367a2.435 2.435 0 00-.036.104l-2.601 7.587a2.357 2.357 0 104.46 1.529l2.072-6.046h11.037l2.073 6.046a2.357 2.357 0 104.46-1.53l-2.602-7.586a2.305 2.305 0 00-.036-.104z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Text;

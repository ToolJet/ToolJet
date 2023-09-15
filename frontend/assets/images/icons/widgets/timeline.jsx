import React from 'react';

const Timeline = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
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
      fillRule="evenodd"
      d="M20.187 18.007a2.37 2.37 0 012.37 2.37v9.482a2.37 2.37 0 11-4.74 0v-9.482a2.37 2.37 0 012.37-2.37zm2.37 16.592a2.37 2.37 0 012.37-2.37h12.346v-2.505a2.37 2.37 0 014.047-1.676l4.874 4.875a2.36 2.36 0 01.691 1.798 2.36 2.36 0 01-.702 1.566L41.32 41.15a2.37 2.37 0 01-4.047-1.676V36.97H24.927a2.37 2.37 0 01-2.37-2.37zM5.259 32.23a2.37 2.37 0 100 4.74h10.187a2.37 2.37 0 000-4.74H5.26z"
      clipRule="evenodd"
    ></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M20.187 28.279a6.32 6.32 0 100 12.641 6.32 6.32 0 000-12.642zM10.705 6.155a1.58 1.58 0 00-1.58 1.58v12.642c0 .873.707 1.58 1.58 1.58h18.963a1.58 1.58 0 001.58-1.58V7.736a1.58 1.58 0 00-1.58-1.58H10.705z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Timeline;

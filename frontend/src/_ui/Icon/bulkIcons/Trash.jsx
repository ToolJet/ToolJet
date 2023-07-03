import React from 'react';

const Trash = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy="trash-icon"
  >
    <g opacity="0.4">
      <path
        d="M14.75 22.75H8.75C6.54086 22.75 4.75 20.9591 4.75 18.75V5.75H18.75V18.75C18.75 20.9591 16.9591 22.75 14.75 22.75Z"
        fill={fill}
      />
    </g>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.75 10C14.1642 10 14.5 10.3358 14.5 10.75L14.5 16.75C14.5 17.1642 14.1642 17.5 13.75 17.5C13.3358 17.5 13 17.1642 13 16.75L13 10.75C13 10.3358 13.3358 10 13.75 10Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.75 10C10.1642 10 10.5 10.3358 10.5 10.75L10.5 16.75C10.5 17.1642 10.1642 17.5 9.75 17.5C9.33579 17.5 9 17.1642 9 16.75L9 10.75C9 10.3358 9.33579 10 9.75 10Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.53223 3.22457C9.04226 2.45953 9.9009 2 10.8204 2H12.6796C13.5991 2 14.4577 2.45953 14.9678 3.22457L16.1514 5H20.75C21.1642 5 21.5 5.33579 21.5 5.75C21.5 6.16421 21.1642 6.5 20.75 6.5H2.75C2.33579 6.5 2 6.16421 2 5.75C2 5.33579 2.33579 5 2.75 5H7.34861L8.53223 3.22457Z"
      fill={fill}
    />
  </svg>
);

export default Trash;

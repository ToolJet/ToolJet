import React from 'react';

const Server = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy="server-icon"
  >
    <path
      opacity="0.4"
      d="M18.0002 2C20.2094 2 22.0002 3.79086 22.0002 6L22.0002 12L2.00024 12L2.00024 6C2.00024 3.79086 3.79111 2 6.00024 2L18.0002 2Z"
      fill={fill}
    />
    <path d="M6 22C3.79086 22 2 20.2091 2 18L2 12L22 12L22 18C22 20.2091 20.2091 22 18 22L6 22Z" fill={fill} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.0002 5.25C18.4145 5.25 18.7502 5.58579 18.7502 6L18.7502 8C18.7502 8.41421 18.4145 8.75 18.0002 8.75C17.586 8.75 17.2502 8.41421 17.2502 8L17.2502 6C17.2502 5.58579 17.586 5.25 18.0002 5.25Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.0002 5.25C14.4145 5.25 14.7502 5.58579 14.7502 6L14.7502 8C14.7502 8.41421 14.4145 8.75 14.0002 8.75C13.586 8.75 13.2502 8.41421 13.2502 8L13.2502 6C13.2502 5.58579 13.586 5.25 14.0002 5.25Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.0002 15.25C18.4145 15.25 18.7502 15.5858 18.7502 16L18.7502 18C18.7502 18.4142 18.4145 18.75 18.0002 18.75C17.586 18.75 17.2502 18.4142 17.2502 18L17.2502 16C17.2502 15.5858 17.586 15.25 18.0002 15.25Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.0002 15.25C14.4145 15.25 14.7502 15.5858 14.7502 16L14.7502 18C14.7502 18.4142 14.4145 18.75 14.0002 18.75C13.586 18.75 13.2502 18.4142 13.2502 18L13.2502 16C13.2502 15.5858 13.586 15.25 14.0002 15.25Z"
      fill={fill}
    />
  </svg>
);

export default Server;

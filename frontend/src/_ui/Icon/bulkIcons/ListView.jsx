import React from 'react';

const ListView = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2 6.5C2 5.94772 2.44772 5.5 3 5.5H6C6.55228 5.5 7 5.94772 7 6.5V9.5C7 10.0523 6.55228 10.5 6 10.5H3C2.44772 10.5 2 10.0523 2 9.5V6.5Z"
      fill={fill}
    />
    <g opacity="0.4">
      <path
        d="M2 14.5C2 13.9477 2.44772 13.5 3 13.5H6C6.55228 13.5 7 13.9477 7 14.5V17.5C7 18.0523 6.55228 18.5 6 18.5H3C2.44772 18.5 2 18.0523 2 17.5V14.5Z"
        fill={fill}
      />
    </g>
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.25 6.25C9.25 5.83579 9.58579 5.5 10 5.5L16 5.5C16.4142 5.5 16.75 5.83579 16.75 6.25C16.75 6.66421 16.4142 7 16 7L10 7C9.58579 7 9.25 6.66421 9.25 6.25Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.25 14.25C9.25 13.8358 9.58579 13.5 10 13.5H16C16.4142 13.5 16.75 13.8358 16.75 14.25C16.75 14.6642 16.4142 15 16 15H10C9.58579 15 9.25 14.6642 9.25 14.25Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.25 9.75C9.25 9.33579 9.58579 9 10 9L22 9C22.4142 9 22.75 9.33579 22.75 9.75C22.75 10.1642 22.4142 10.5 22 10.5L10 10.5C9.58579 10.5 9.25 10.1642 9.25 9.75Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.25 17.75C9.25 17.3358 9.58579 17 10 17H22C22.4142 17 22.75 17.3358 22.75 17.75C22.75 18.1642 22.4142 18.5 22 18.5H10C9.58579 18.5 9.25 18.1642 9.25 17.75Z"
      fill={fill}
    />
  </svg>
);

export default ListView;

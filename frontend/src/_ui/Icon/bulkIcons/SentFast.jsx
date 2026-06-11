import React from 'react';

const SentFast = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy="sent-fast-icon"
  >
    <path
      opacity="0.4"
      d="M20.6842 9.87225L9.45352 4.26033C7.45607 3.26221 5.30682 5.31474 6.21382 7.35425L7.85018 11.0338C8.12373 11.6489 8.12373 12.3511 7.85018 12.9662L6.21382 16.6458C5.30682 18.6853 7.45607 20.7378 9.45352 19.7397L20.6842 14.1278C22.4386 13.2511 22.4386 10.7489 20.6842 9.87225Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.75 12C7.75 11.5858 8.08579 11.25 8.5 11.25H12C12.4142 11.25 12.75 11.5858 12.75 12C12.75 12.4142 12.4142 12.75 12 12.75H8.5C8.08579 12.75 7.75 12.4142 7.75 12Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.25 10C1.25 9.58579 1.58579 9.25 2 9.25H4C4.41421 9.25 4.75 9.58579 4.75 10C4.75 10.4142 4.41421 10.75 4 10.75H2C1.58579 10.75 1.25 10.4142 1.25 10Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.25 14C1.25 13.5858 1.58579 13.25 2 13.25H4C4.41421 13.25 4.75 13.5858 4.75 14C4.75 14.4142 4.41421 14.75 4 14.75H2C1.58579 14.75 1.25 14.4142 1.25 14Z"
      // fill={fill}
    />
  </svg>
);

export default SentFast;

import React from 'react';

const Search = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25', style }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.25 12.2891C3.25 17.1216 7.16751 21.0391 12 21.0391C16.8325 21.0391 20.75 17.1216 20.75 12.2891C20.75 7.45657 16.8325 3.53906 12 3.53906C7.16751 3.53906 3.25 7.45657 3.25 12.2891ZM12 22.5391C6.33908 22.5391 1.75 17.95 1.75 12.2891C1.75 6.62814 6.33908 2.03906 12 2.03906C17.6609 2.03906 22.25 6.62814 22.25 12.2891C22.25 14.8496 21.3111 17.1908 19.7589 18.9873L23.0303 22.2587C23.3232 22.5516 23.3232 23.0265 23.0303 23.3194C22.7374 23.6123 22.2626 23.6123 21.9697 23.3194L18.6982 20.0479C16.9017 21.6002 14.5605 22.5391 12 22.5391Z"
      fill={fill}
    />
  </svg>
);

export default Search;

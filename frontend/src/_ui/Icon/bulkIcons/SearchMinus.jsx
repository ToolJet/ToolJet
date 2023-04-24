import React from 'react';

const SearchMinus = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.9697 16.9697C17.2626 16.6768 17.7374 16.6768 18.0303 16.9697L22.5303 21.4697C22.8232 21.7626 22.8232 22.2374 22.5303 22.5303C22.2374 22.8232 21.7626 22.8232 21.4697 22.5303L16.9697 18.0303C16.6768 17.7374 16.6768 17.2626 16.9697 16.9697Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21ZM15.5 12.25C15.9142 12.25 16.25 11.9142 16.25 11.5C16.25 11.0858 15.9142 10.75 15.5 10.75H7.5C7.08579 10.75 6.75 11.0858 6.75 11.5C6.75 11.9142 7.08579 12.25 7.5 12.25H15.5Z"
      fill={fill}
    />
  </svg>
);

export default SearchMinus;

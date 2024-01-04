import React from 'react';

const Eye = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.6303 14.936C22.7899 13.7159 22.7899 11.8622 21.6303 10.6422C19.6745 8.58439 16.3155 5.78906 12.5 5.78906C8.68448 5.78906 5.32549 8.5844 3.36971 10.6422C2.2101 11.8622 2.2101 13.7159 3.36971 14.936C5.32549 16.9937 8.68448 19.7891 12.5 19.7891C16.3155 19.7891 19.6745 16.9937 21.6303 14.936ZM12.5 15.7891C14.1569 15.7891 15.5 14.4459 15.5 12.7891C15.5 11.1322 14.1569 9.78906 12.5 9.78906C10.8431 9.78906 9.5 11.1322 9.5 12.7891C9.5 14.4459 10.8431 15.7891 12.5 15.7891Z"
      fill={fill}
    />
  </svg>
);

export default Eye;

import React from 'react';

const Dislike = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18 15H20C21.1046 15 22 14.1046 22 13V6C22 4.89543 21.1046 4 20 4H18C16.8954 4 16 4.89543 16 6V13C16 14.1046 16.8954 15 18 15Z"
      fill={fill}
    />
    <path
      opacity="0.4"
      d="M8.12309 3H11.7889C12.5786 3 13.3506 3.23375 14.0077 3.6718L15.5547 4.70313C15.8329 4.8886 16 5.20083 16 5.53518V13.7344C16 13.9085 15.9546 14.0795 15.8682 14.2306L12 21H10.6713C8.67453 21 7.48355 18.7746 8.59115 17.1133L9.99998 15H4.56153C3.26039 15 2.30567 13.7772 2.62125 12.5149L4.24252 6.02986C4.68768 4.24919 6.28761 3 8.12309 3Z"
      fill={fill}
    />
  </svg>
);

export default Dislike;

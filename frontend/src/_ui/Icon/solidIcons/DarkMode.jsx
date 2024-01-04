import React from 'react';

const DarkMode = ({ fill = '#C1C8CD', width = '19', className = '', viewBox = '0 0 19 18' }) => (
  <svg
    className={className}
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.17169 11.6578C8.25106 11.6578 12.3687 7.54012 12.3687 2.46075C12.3687 1.8572 12.3106 1.26724 12.1996 0.696142C12.1234 0.303999 12.4857 -0.0486582 12.8541 0.105701C16.1704 1.49502 18.5001 4.7715 18.5001 8.5921C18.5001 13.6715 14.3824 17.7891 9.30303 17.7891C5.48244 17.7891 2.20596 15.4595 0.816639 12.1432C0.662279 11.7747 1.01494 11.4125 1.40708 11.4887C1.97817 11.5996 2.56814 11.6578 3.17169 11.6578Z"
      fill={fill}
    />
  </svg>
);

export default DarkMode;

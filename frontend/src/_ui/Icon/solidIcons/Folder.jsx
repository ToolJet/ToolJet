import React from 'react';

const Folder = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M22.5 17.7891V10.7891C22.5 8.57992 20.7091 6.78906 18.5 6.78906H15.8333C14.9679 6.78906 14.1257 6.50835 13.4333 5.98906L11.5667 4.58906C10.8743 4.06977 10.0321 3.78906 9.16667 3.78906H6.5C4.29086 3.78906 2.5 5.57992 2.5 7.78906V17.7891C2.5 19.9982 4.29086 21.7891 6.5 21.7891H18.5C20.7091 21.7891 22.5 19.9982 22.5 17.7891Z"
      fill={fill}
    />
  </svg>
);

export default Folder;

import React from 'react';

const User = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M12.5 11.7891C14.7091 11.7891 16.5 9.9982 16.5 7.78906C16.5 5.57992 14.7091 3.78906 12.5 3.78906C10.2909 3.78906 8.5 5.57992 8.5 7.78906C8.5 9.9982 10.2909 11.7891 12.5 11.7891ZM12.5 21.7891C16.366 21.7891 19.5 19.9982 19.5 17.7891C19.5 15.5799 16.366 13.7891 12.5 13.7891C8.63401 13.7891 5.5 15.5799 5.5 17.7891C5.5 19.9982 8.63401 21.7891 12.5 21.7891Z"
      fill={fill}
    />
  </svg>
);

export default User;

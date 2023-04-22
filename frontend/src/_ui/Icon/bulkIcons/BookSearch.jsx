import React from 'react';

const BookSearch = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path opacity="0.4" d="M17 2H7C5.34315 2 4 3.34315 4 5V19H20V5C20 3.34315 18.6569 2 17 2Z" fill="#121212" />
    <path
      d="M20 16H7C5.34315 16 4 17.3431 4 19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V16Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 6.75C10.7574 6.75 9.75 7.75736 9.75 9C9.75 10.2426 10.7574 11.25 12 11.25C13.2426 11.25 14.25 10.2426 14.25 9C14.25 7.75736 13.2426 6.75 12 6.75ZM8.25 9C8.25 6.92893 9.92893 5.25 12 5.25C14.0711 5.25 15.75 6.92893 15.75 9C15.75 9.76431 15.5213 10.4752 15.1287 11.068L16.0303 11.9697C16.3232 12.2626 16.3232 12.7374 16.0303 13.0303C15.7374 13.3232 15.2626 13.3232 14.9697 13.0303L14.068 12.1287C13.4752 12.5213 12.7643 12.75 12 12.75C9.92893 12.75 8.25 11.0711 8.25 9Z"
      fill={fill}
    />
  </svg>
);

export default BookSearch;

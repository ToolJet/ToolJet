import React from 'react';

const DefaultResponseAvatar = ({
  fill = '#E54D2E',
  width = '15',
  height = '18',
  className = '',
  viewBox = '0 0 15 18',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.99986 10.7141C11.9723 10.7141 13.5713 9.11516 13.5713 7.14272C13.5713 5.17027 11.9723 3.57129 9.99986 3.57129C8.02741 3.57129 6.42843 5.17027 6.42843 7.14272C6.42843 9.11516 8.02741 10.7141 9.99986 10.7141ZM9.99978 12.857C6.94693 12.857 4.30073 14.5981 3 17.1414C4.80373 18.9096 7.27444 19.9999 9.99978 19.9999C12.7251 19.9999 15.1959 18.9096 16.9996 17.1414C15.6989 14.5981 13.0526 12.857 9.99978 12.857Z"
      fill={fill}
    />
  </svg>
);

export default DefaultResponseAvatar;

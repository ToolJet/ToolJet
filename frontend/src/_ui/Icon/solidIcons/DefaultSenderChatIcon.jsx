import React from 'react';

const DefaultSenderChatIcon = ({ fill = '#E54D2E', width = '24', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.9999 12.7141C13.9723 12.7141 15.5713 11.1152 15.5713 9.14272C15.5713 7.17027 13.9723 5.57129 11.9999 5.57129C10.0274 5.57129 8.42843 7.17027 8.42843 9.14272C8.42843 11.1152 10.0274 12.7141 11.9999 12.7141ZM11.9998 14.857C8.94693 14.857 6.30073 16.5981 5 19.1414C6.80373 20.9096 9.27444 21.9999 11.9998 21.9999C14.7251 21.9999 17.1959 20.9096 18.9996 19.1414C17.6989 16.5981 15.0526 14.857 11.9998 14.857Z"
      fill={fill}
    />
  </svg>
);

export default DefaultSenderChatIcon;

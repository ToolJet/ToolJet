import React from 'react';

const BookDemo = ({ className = '', fill = '#4368E3', width = '16', height = '17', ...props }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.83333 1.96435C5.83333 1.69819 5.60948 1.48242 5.33333 1.48242C5.05719 1.48242 4.83333 1.69819 4.83333 1.96435V2.92821H4.66667C3.19391 2.92821 2 4.07896 2 5.49849V5.98041H14V5.49849C14 4.07896 12.8061 2.92821 11.3333 2.92821H11.1667V1.96435C11.1667 1.69819 10.9428 1.48242 10.6667 1.48242C10.3905 1.48242 10.1667 1.69819 10.1667 1.96435V2.92821H5.83333V1.96435ZM2 6.94427H14V12.2455C14 13.665 12.8061 14.8158 11.3333 14.8158H4.66667C3.19391 14.8158 2 13.665 2 12.2455V6.94427Z"
        fill={fill}
      />
    </svg>
  );
};

export default BookDemo;

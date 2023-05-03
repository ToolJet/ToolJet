import React from 'react';

const Calender = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M9.25 2.78906C9.25 2.37485 8.91421 2.03906 8.5 2.03906C8.08579 2.03906 7.75 2.37485 7.75 2.78906V4.28906H7.5C5.29086 4.28906 3.5 6.07992 3.5 8.28906V9.03906H21.5V8.28906C21.5 6.07992 19.7091 4.28906 17.5 4.28906H17.25V2.78906C17.25 2.37485 16.9142 2.03906 16.5 2.03906C16.0858 2.03906 15.75 2.37485 15.75 2.78906V4.28906H9.25V2.78906ZM3.5 10.5391H21.5V18.7891C21.5 20.9982 19.7091 22.7891 17.5 22.7891H7.5C5.29086 22.7891 3.5 20.9982 3.5 18.7891V10.5391Z"
      fill={fill}
    />
  </svg>
);

export default Calender;

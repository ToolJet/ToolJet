import React from 'react';

const Columns = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M2.5 6.78906C2.5 4.57992 4.29086 2.78906 6.5 2.78906H18.5C20.7091 2.78906 22.5 4.57992 22.5 6.78906V8.03906H2.5V6.78906ZM2.5 9.53906V18.7891C2.5 20.9982 4.29086 22.7891 6.5 22.7891H7.75V9.53906H2.5ZM9.25 22.7891H15.75V9.53906H9.25V22.7891ZM17.25 22.7891H18.5C20.7091 22.7891 22.5 20.9982 22.5 18.7891V9.53906H17.25V22.7891Z"
      fill={fill}
    />
  </svg>
);

export default Columns;

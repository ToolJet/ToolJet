import React from 'react';

const Modal = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      fillRule="evenodd"
      d="M17.163 2h24.306c2.993 0 5.42 2.414 5.42 5.392v20.531c0 2.979-2.427 5.393-5.42 5.393h-4.541v-5.463c0-5.162-4.206-9.347-9.395-9.347h-15.79V7.394C11.743 4.415 14.17 2 17.163 2z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      d="M41.469 2H17.163c-2.993 0-5.42 2.415-5.42 5.393v4.005H46.89V7.392c0-2.978-2.427-5.392-5.42-5.392z"
    ></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M27.533 22.46l-19.225.001c-2.993 0-5.42 2.415-5.42 5.393v12.754c0 2.978 2.427 5.392 5.42 5.392h19.225c2.993 0 5.42-2.415 5.42-5.393V27.853c0-2.978-2.427-5.392-5.42-5.392z"
      clipRule="evenodd"
    ></path>
    <path
      fill="#3E63DD"
      d="M27.533 22.46l-19.225.001c-2.993 0-5.42 2.415-5.42 5.393v4.108h30.065v-4.109c0-2.978-2.427-5.392-5.42-5.392z"
    ></path>
  </svg>
);

export default Modal;

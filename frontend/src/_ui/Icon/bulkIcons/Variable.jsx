import React from 'react';

const Variable = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      opacity="0.4"
      d="M2 6C2 3.79086 3.79086 2 6 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6Z"
      fill={fill}
    />
    <path
      d="M14.1215 16.4618L9.87854 12.2189"
      stroke="#121212"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M9.87854 16.4618L14.1215 12.2189"
      stroke="#121212"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M6.73779 17.4252L6.61438 17.1211C5.85764 15.2563 5.89115 13.164 6.70721 11.3244L6.73779 11.2555"
      stroke="#121212"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M17.2622 17.4252L17.3856 17.1211C18.1424 15.2563 18.1089 13.164 17.2928 11.3244L17.2622 11.2555"
      stroke="#121212"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path d="M22 7H2V6C2 3.79086 3.79086 2 6 2H18C20.2091 2 22 3.79086 22 6V7Z" fill={fill} />
  </svg>
);

export default Variable;

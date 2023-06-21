import React from 'react';

const InformationCircle = ({
  fill = '#28303F',
  innerFill = '#28303F',
  width = '25',
  className = '',
  viewBox = '0 0 25 25',
}) => (
  <svg width={width} height={width} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      opacity="0.4"
      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      fill={fill}
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V9C12.75 9.41421 12.4142 9.75 12 9.75C11.5858 9.75 11.25 9.41421 11.25 9V8C11.25 7.58579 11.5858 7.25 12 7.25ZM12 10.75C12.4142 10.75 12.75 11.0858 12.75 11.5V16C12.75 16.4142 12.4142 16.75 12 16.75C11.5858 16.75 11.25 16.4142 11.25 16V11.5C11.25 11.0858 11.5858 10.75 12 10.75Z"
      fill={innerFill}
    />
  </svg>
);

export default InformationCircle;

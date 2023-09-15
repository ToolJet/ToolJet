import React from 'react';

const InRectangle = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    fill={fill}
    height={width}
    viewBox={viewBox}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.4878 13.7451L20.1159 12.2024C22.628 11.365 22.628 7.81165 20.1159 6.97427L5.63158 2.14617C3.47747 1.42813 1.42813 3.47748 2.14617 5.63158L6.97427 20.1159C7.81165 22.628 11.365 22.628 12.2024 20.1159L13.7451 15.4878C14.0194 14.665 14.665 14.0194 15.4878 13.7451Z"
      fill={fill}
    />
  </svg>
);

export default InRectangle;

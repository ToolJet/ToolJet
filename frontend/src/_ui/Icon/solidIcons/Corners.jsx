import React from 'react';

const Corners = ({ style, fill = '#C1C8CD', width = '12', height = '13', className = '', viewBox = '0 0 12 13' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill={fill}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g id="corners ">
      <path
        id="vector"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M2 1.5C1.44772 1.5 1 1.94772 1 2.5V3.5C1 4.05228 1.44772 4.5 2 4.5H2.125V8.5H2C1.44772 8.5 1 8.94772 1 9.5V10.5C1 11.0523 1.44772 11.5 2 11.5H3C3.55228 11.5 4 11.0523 4 10.5V10.375H8V10.5C8 11.0523 8.44772 11.5 9 11.5H10C10.5523 11.5 11 11.0523 11 10.5V9.5C11 8.94772 10.5523 8.5 10 8.5H9.875V4.5H10C10.5523 4.5 11 4.05228 11 3.5V2.5C11 1.94772 10.5523 1.5 10 1.5H9C8.44772 1.5 8 1.94772 8 2.5V2.625L4 2.625V2.5C4 1.94772 3.55228 1.5 3 1.5H2ZM4 3.375V3.5C4 4.05228 3.55228 4.5 3 4.5H2.875V8.5H3C3.55228 8.5 4 8.94772 4 9.5V9.625H8V9.5C8 8.94772 8.44772 8.5 9 8.5H9.125V4.5H9C8.44772 4.5 8 4.05228 8 3.5V3.375L4 3.375Z"
        fill={fill}
      />
    </g>
  </svg>
);

export default Corners;

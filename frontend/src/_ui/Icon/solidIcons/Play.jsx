import React from 'react';

const Play = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox={viewBox} fill="none">
    <path
      d="M11.9044 8.54526L4.81454 12.5966C3.62831 13.2744 2.15234 12.4179 2.15234 11.0517V2.949C2.15234 1.58275 3.62831 0.726218 4.81454 1.40407L11.9044 5.45539C13.0998 6.13849 13.0998 7.86217 11.9044 8.54526Z"
      fill={fill}
    />
  </svg>
);

export default Play;

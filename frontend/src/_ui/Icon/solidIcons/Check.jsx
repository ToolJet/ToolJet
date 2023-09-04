import React from 'react';

const Check = ({ fill = '#3E63DD', width = '8', className = 'tj-icon', viewBox = '0 0 8 8', height }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M17.2559 5.4013C17.5814 5.72674 17.5814 6.25438 17.2559 6.57982L8.92258 14.9131C8.59715 15.2386 8.06951 15.2386 7.74407 14.9131L3.57741 10.7465C3.25197 10.421 3.25197 9.89341 3.57741 9.56797C3.90284 9.24253 4.43048 9.24253 4.75592 9.56797L8.33333 13.1454L16.0774 5.4013C16.4028 5.07587 16.9305 5.07587 17.2559 5.4013Z"
        fill={fill}
      />
    </svg>
  );
};
export default Check;

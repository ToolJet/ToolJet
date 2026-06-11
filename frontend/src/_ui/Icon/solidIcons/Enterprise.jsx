import React from 'react';

const Enterprise = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg width={width} height={width} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill={fill}
      className={className}
      d="M14.1092 11.4871C9.62563 13.0454 8.14756 14.7805 7.05461 19.102C5.96165 14.7805 4.48361 13.0454 0 11.4871C4.48361 9.92894 5.96165 8.19386 7.05461 3.87231C8.14756 8.19386 9.62563 9.92894 14.1092 11.4871Z"
    />
    <path
      fill={fill}
      className={className}
      opacity="0.6"
      d="M19.6696 4.27827C17.1405 5.15372 16.3068 6.12857 15.6902 8.55651C15.0737 6.12857 14.24 5.15372 11.7109 4.27827C14.24 3.40283 15.0737 2.42797 15.6902 0C16.3068 2.42797 17.1405 3.40283 19.6696 4.27827Z"
    />
    <path
      fill={fill}
      className={className}
      opacity="0.6"
      d="M20.0002 16.8999C18.1283 17.5343 17.5112 18.2407 17.0548 20.0001C16.5985 18.2407 15.9814 17.5343 14.1094 16.8999C15.9814 16.2655 16.5985 15.5592 17.0548 13.7998C17.5112 15.5592 18.1283 16.2655 20.0002 16.8999Z"
    />
  </svg>
);

export default Enterprise;

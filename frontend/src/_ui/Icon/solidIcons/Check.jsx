import React from 'react';

const Check = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox="0 0 20 20" fill="none">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M17.2566 5.24408C17.582 5.56951 17.582 6.09715 17.2566 6.42259L8.92324 14.7559C8.5978 15.0814 8.07017 15.0814 7.74473 14.7559L3.57806 10.5893C3.25263 10.2638 3.25263 9.73618 3.57806 9.41074C3.9035 9.08531 4.43114 9.08531 4.75657 9.41074L8.33398 12.9882L16.0781 5.24408C16.4035 4.91864 16.9311 4.91864 17.2566 5.24408Z"
      fill={fill}
    />
  </svg>
);

export default Check;

import React from 'react';

const Sent = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      opacity="0.4"
      d="M19.3894 3H4.61094C2.33933 3 1.1554 5.63548 2.6962 7.26234L5.78568 10.5244C6.23 10.9935 6.47673 11.6086 6.47673 12.247V18.4553C6.47673 20.8735 9.61615 21.9233 11.1394 20.0145L21.4463 7.09894C22.7775 5.43071 21.5578 3 19.3894 3Z"
      fill={fill}
    />
  </svg>
);

export default Sent;

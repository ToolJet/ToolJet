import React from 'react';

const Remove = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.773 7.22711C17.0659 7.52 17.0659 7.99487 16.773 8.28777L8.28772 16.773C7.99483 17.0659 7.51996 17.0659 7.22706 16.773C6.93417 16.4802 6.93417 16.0053 7.22706 15.7124L15.7123 7.22711C16.0052 6.93421 16.4801 6.93421 16.773 7.22711Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.7729 16.773C16.48 17.0659 16.0051 17.0659 15.7122 16.773L7.22695 8.28772C6.93406 7.99483 6.93406 7.51996 7.22695 7.22706C7.51984 6.93417 7.99472 6.93417 8.28761 7.22706L16.7729 15.7123C17.0658 16.0052 17.0658 16.4801 16.7729 16.773Z"
      fill={fill}
    />
  </svg>
);

export default Remove;

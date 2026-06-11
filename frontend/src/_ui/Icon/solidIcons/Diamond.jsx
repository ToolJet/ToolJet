import React from 'react';

const Diamond = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M19.0408 4.51173L21.9629 7.84056C22.641 8.61308 22.6814 9.76456 22.059 10.5838L14.1854 20.9487C13.3342 22.0692 11.6658 22.0692 10.8146 20.9487L2.94095 10.5838C2.31861 9.76456 2.35896 8.61308 3.03709 7.84056L5.95918 4.51173C6.36269 4.05206 6.94106 3.78906 7.54842 3.78906H10.6099H14.6263H17.4516C18.0589 3.78906 18.6373 4.05206 19.0408 4.51173Z"
      fill={fill}
    />
  </svg>
);

export default Diamond;

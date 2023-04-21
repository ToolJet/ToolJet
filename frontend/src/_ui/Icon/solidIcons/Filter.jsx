import React from 'react';

const Filter = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M19.3188 2.78906H5.68117C3.942 2.78906 2.90466 4.70461 3.86937 6.1347L9.59107 13.6165C10.068 14.3235 10.3225 15.1542 10.3225 16.0039V21.7109C10.3225 22.6695 11.4952 23.1496 12.1811 22.4718L14.3586 20.3198C14.5628 20.118 14.6775 19.8443 14.6775 19.559V16.0039C14.6775 15.1542 14.932 14.3235 15.4089 13.6165L21.1306 6.1347C22.0953 4.70461 21.058 2.78906 19.3188 2.78906Z"
      fill={fill}
    />
  </svg>
);

export default Filter;

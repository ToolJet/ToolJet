import React from 'react';

const Filter = ({ fill = '#C1C8CD', width = '24', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18.8188 2H5.18117C3.442 2 2.40466 3.91555 3.36937 5.34564L9.09107 12.8274C9.56799 13.5344 9.82249 14.3651 9.82249 15.2148V20.9219C9.82249 21.8805 10.9952 22.3605 11.6811 21.6827L13.8586 19.5307C14.0628 19.329 14.1775 19.0553 14.1775 18.7699V15.2148C14.1775 14.3651 14.432 13.5344 14.9089 12.8274L20.6306 5.34564C21.5953 3.91555 20.558 2 18.8188 2Z"
      fill={fill}
    />
  </svg>
);

export default Filter;

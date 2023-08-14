import React from 'react';

const Plus = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25', dataCy = '', style }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    data-cy={dataCy}
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 5C12.5523 5 13 5.44772 13 6V12H19C19.5523 12 20 12.4477 20 13C20 13.5523 19.5523 14 19 14H13V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V14H5C4.44772 14 4 13.5523 4 13C4 12.4477 4.44772 12 5 12H11V6C11 5.44772 11.4477 5 12 5Z"
      fill={fill}
    />
  </svg>
);

export default Plus;

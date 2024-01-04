import React from 'react';

const MoreVertical = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M10.5 7.03906C10.5 6.34871 11.0596 5.78906 11.75 5.78906C12.4404 5.78906 13 6.34871 13 7.03906C13 7.72942 12.4404 8.28906 11.75 8.28906C11.0596 8.28906 10.5 7.72942 10.5 7.03906ZM10.5 12.0391C10.5 11.3487 11.0596 10.7891 11.75 10.7891C12.4404 10.7891 13 11.3487 13 12.0391C13 12.7294 12.4404 13.2891 11.75 13.2891C11.0596 13.2891 10.5 12.7294 10.5 12.0391ZM11.75 15.7891C11.0596 15.7891 10.5 16.3487 10.5 17.0391C10.5 17.7294 11.0596 18.2891 11.75 18.2891C12.4404 18.2891 13 17.7294 13 17.0391C13 16.3487 12.4404 15.7891 11.75 15.7891Z"
      fill={fill}
    />
  </svg>
);

export default MoreVertical;

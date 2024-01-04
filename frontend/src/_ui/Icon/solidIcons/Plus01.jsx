import React from 'react';

const Plus01 = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M10.5 18.7891C10.5 19.8936 11.3954 20.7891 12.5 20.7891C13.6046 20.7891 14.5 19.8936 14.5 18.7891V14.7891H18.5C19.6046 14.7891 20.5 13.8936 20.5 12.7891C20.5 11.6845 19.6046 10.7891 18.5 10.7891H14.5V6.78906C14.5 5.68449 13.6046 4.78906 12.5 4.78906C11.3954 4.78906 10.5 5.68449 10.5 6.78906V10.7891L6.5 10.7891C5.39543 10.7891 4.5 11.6845 4.5 12.7891C4.5 13.8936 5.39543 14.7891 6.5 14.7891L10.5 14.7891V18.7891Z"
      fill={fill}
    />
  </svg>
);

export default Plus01;

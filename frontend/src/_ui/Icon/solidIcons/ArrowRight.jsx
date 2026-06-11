import React from 'react';

const ArrowRight = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
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
      d="M19.0303 13.3194C19.3232 13.0265 19.3232 12.5516 19.0303 12.2587L15.0303 8.25873C14.7374 7.96584 14.2626 7.96584 13.9697 8.25873C13.6768 8.55163 13.6768 9.0265 13.9697 9.31939L16.6893 12.0391H6.5C6.08579 12.0391 5.75 12.3748 5.75 12.7891C5.75 13.2033 6.08579 13.5391 6.5 13.5391H16.6893L13.9697 16.2587C13.6768 16.5516 13.6768 17.0265 13.9697 17.3194C14.2626 17.6123 14.7374 17.6123 15.0303 17.3194L19.0303 13.3194Z"
      fill={fill}
    />
  </svg>
);

export default ArrowRight;

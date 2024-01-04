import React from 'react';

const Share = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      fillRule="evenodd"
      d="M22.5 6.29a3.5 3.5 0 01-6.225 2.195.752.752 0 01-.07.04l-6.738 3.37a.77.77 0 01-.074.031 3.507 3.507 0 010 1.726c.025.009.05.02.074.032l6.737 3.369a.756.756 0 01.07.04 3.5 3.5 0 11-.668 1.334.779.779 0 01-.073-.033l-6.737-3.368a.786.786 0 01-.07-.04 3.5 3.5 0 110-4.393.761.761 0 01.07-.04l6.737-3.37a.769.769 0 01.074-.031 3.5 3.5 0 116.893-.863z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Share;

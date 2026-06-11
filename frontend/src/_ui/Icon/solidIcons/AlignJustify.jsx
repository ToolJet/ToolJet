import React from 'react';

const AlignJustify = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => {
  return (
    <svg width={width} height={width} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 8H14M2 12H14M2 4H8H14H2Z"
        stroke={'#8092AC'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AlignJustify;

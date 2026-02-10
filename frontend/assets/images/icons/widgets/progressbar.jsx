import React from 'react';

const Progressbar = ({ fill = '#D7DBDF', width = 23, className = '', viewBox = '0 0 23 22' }) => (
  <svg width={width} height={width} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.25 11L21.25 11" stroke="#CCD1D5" stroke-width="2.5" stroke-linecap="round" />
    <path d="M1.25 11H3.25" stroke="#4368E3" stroke-width="2.5" stroke-linecap="round" />
    <path d="M6.25 11H8.25" stroke="#4368E3" stroke-width="2.5" stroke-linecap="round" />
  </svg>
);

export default Progressbar;

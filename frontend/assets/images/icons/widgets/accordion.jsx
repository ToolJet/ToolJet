import React from 'react';

const Accordion = ({ fill = '#D7DBDF', width = 22, className = '', viewBox = '0 0 22 22' }) => (
  <svg width={width} height={width} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_285_740)">
      <rect width="22" height="5" rx="1" fill="#CCD1D5" />
      <rect y="7" width="22" height="15" rx="1" fill="#CCD1D5" />
      <path d="M0 8C0 7.44772 0.447715 7 1 7H21C21.5523 7 22 7.44772 22 8V13H0V8Z" fill="#4368E3" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M17.0381 10.9028C17.1155 11.113 17.2978 11.25 17.5 11.25H19.5C19.7022 11.25 19.8845 11.113 19.9619 10.9028C20.0393 10.6926 19.9965 10.4506 19.8535 10.2898L18.8535 9.16476C18.6583 8.94508 18.3417 8.94508 18.1465 9.16476L17.1465 10.2898C17.0035 10.4506 16.9607 10.6926 17.0381 10.9028Z"
        fill="#CCD1D5"
      />
    </g>
    <defs>
      <clipPath id="clip0_285_740">
        <rect width="22" height="22" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default Accordion;

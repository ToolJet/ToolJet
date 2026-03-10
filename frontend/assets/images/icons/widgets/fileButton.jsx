import React from 'react';

const FileButton = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="27"
    height="27"
    viewBox="0 0 27 27"
    fill="none"
    {...props}
  >
    <rect width="27" height="27" rx="4" fill="currentColor" fillOpacity="0.12" />
    <path
      d="M8 19h11M13.5 8v9M10 13l3.5-3.5L17 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default FileButton;

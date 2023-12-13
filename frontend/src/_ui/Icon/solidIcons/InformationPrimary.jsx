import React from 'react';

const InformationPrimary = ({ fill = '#3E63DD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
  >
    <circle opacity="0.4" cx="10.0547" cy="10" r="10" fill={fill} />
    <path
      d="M11.0547 5C11.0547 5.55228 10.607 6 10.0547 6C9.5024 6 9.05469 5.55228 9.05469 5C9.05469 4.44772 9.5024 4 10.0547 4C10.607 4 11.0547 4.44772 11.0547 5Z"
      fill="#3E63DD"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M8.30469 8C8.30469 7.58579 8.64047 7.25 9.05469 7.25H10.0547C10.4689 7.25 10.8047 7.58579 10.8047 8V15C10.8047 15.4142 10.4689 15.75 10.0547 15.75C9.64047 15.75 9.30469 15.4142 9.30469 15V8.75H9.05469C8.64047 8.75 8.30469 8.41421 8.30469 8Z"
      fill="#3E63DD"
    />
  </svg>
);

export default InformationPrimary;

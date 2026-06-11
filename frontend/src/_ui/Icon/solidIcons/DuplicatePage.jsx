import React from 'react';

const DuplicatePage = ({ fill = '#C1C8CD', width = '14', className = '', viewBox = '0 0 14 14' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7.37484 3.79102H4.6665V3.49935C4.6665 2.21068 5.71117 1.16602 6.99984 1.16602H10.4998C11.7885 1.16602 12.8332 2.21068 12.8332 3.49935V6.99935C12.8332 8.28801 11.7885 9.33268 10.4998 9.33268H10.2082V6.62435C10.2082 5.05954 8.93964 3.79102 7.37484 3.79102Z"
      fill={fill}
    />
    <path
      d="M6.99984 12.8327H3.49984C2.21117 12.8327 1.1665 11.788 1.1665 10.4993V6.99935C1.1665 5.71068 2.21117 4.66602 3.49984 4.66602H6.99984C8.2885 4.66602 9.33317 5.71068 9.33317 6.99935V10.4993C9.33317 11.788 8.2885 12.8327 6.99984 12.8327Z"
      fill={fill}
    />
  </svg>
);

export default DuplicatePage;

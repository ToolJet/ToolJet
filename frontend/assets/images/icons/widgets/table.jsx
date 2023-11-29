import React from 'react';

const Table = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill="#3E63DD" d="M7.369 14.678H22.101V28.847H7.369z"></path>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M42.146 16.399h-6.032v10.207h6.032V16.4zm-10.775 0h-6.008v10.207h6.008V16.4zm-10.751 0H7.632v10.207H20.62V16.4zm4.743 14.95h6.008v9.908h-6.008V31.35zM41.498 46H8.28a5.391 5.391 0 01-5.391-5.391V7.391A5.391 5.391 0 018.279 2h33.219a5.391 5.391 0 015.39 5.391V40.61A5.391 5.391 0 0141.499 46zm-5.384-14.65v9.907h5.384c.357 0 .648-.29.648-.648v-9.26h-6.032zm-15.494 0H7.632v9.259c0 .358.29.648.648.648h12.34V31.35z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Table;

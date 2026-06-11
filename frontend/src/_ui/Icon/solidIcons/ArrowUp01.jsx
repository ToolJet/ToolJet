import React from 'react';

const ArrowUp01 = ({ width = '24', fill = '#6A727C', className = '', viewBox = '0 0 24 24' }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.4387 2.41842C12.8808 1.86053 11.9763 1.86053 11.4184 2.41842L6.41841 7.41841C5.86053 7.97631 5.86053 8.88083 6.41841 9.43873C6.97631 9.99661 7.88083 9.99661 8.43873 9.43873L11 6.87744V20.5714C11 21.3604 11.6396 22 12.4286 22C13.2175 22 13.8571 21.3604 13.8571 20.5714V6.87744L16.4184 9.43873C16.9763 9.99661 17.8809 9.99661 18.4387 9.43873C18.9966 8.88083 18.9966 7.97631 18.4387 7.41841L13.4387 2.41842Z"
      fill={fill}
    />
  </svg>
);

export default ArrowUp01;

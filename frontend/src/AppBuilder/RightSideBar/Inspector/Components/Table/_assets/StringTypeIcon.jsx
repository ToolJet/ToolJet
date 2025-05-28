import React from 'react';

const StringTypeIcon = ({ fill = '#ACB2B9', width = '16', className = '', viewBox = '0 0 16 16', style, height }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.4475 9.94423L11.9364 14.1134C12.0912 14.5467 12.5681 14.7726 13.0015 14.6178C13.4349 14.463 13.6607 13.9862 13.506 13.5527L9.52622 2.40948C9.29572 1.76408 8.68439 1.33325 7.99905 1.33325C7.31372 1.33325 6.70239 1.76408 6.47189 2.40948L2.49213 13.5527C2.33734 13.9862 2.56321 14.463 2.99663 14.6178C3.43005 14.7726 3.90689 14.5467 4.06168 14.1134L5.55065 9.94423H10.4475ZM9.85224 8.27759L7.99905 3.08868L6.14587 8.27759H9.85224Z"
      fill={fill}
    />
  </svg>
);

export default StringTypeIcon;

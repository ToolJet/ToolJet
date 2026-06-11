import React from 'react';

const TickV3 = ({ fill = '#3E63DD', width = '21', className = '', viewBox = '0 0 21 20', style }) => (
  <svg
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M18.6462 3.62394C19.1955 4.07345 19.2765 4.88325 18.827 5.43265L10.0711 16.2486C8.74909 18.0197 7.48224 17.5123 6.38868 16.5554L2.88988 13.494C2.35565 13.0265 2.30151 12.2145 2.76897 11.6803C3.23642 11.146 4.04844 11.0919 4.58268 11.5594L8.08147 14.6209L16.8375 3.80481C17.287 3.2554 18.0967 3.17442 18.6462 3.62394Z"
      fill={fill}
    />
  </svg>
);

export default TickV3;

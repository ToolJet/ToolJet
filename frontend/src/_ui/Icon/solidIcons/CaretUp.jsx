import React from 'react';

const CaretUp = ({ fill = '#C1C8CD', width = '16', className = '', viewBox = '0 0 16 16' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox={viewBox} fill="none">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.5272 8.83298C12.6634 9.02872 12.7041 9.32308 12.6304 9.57882C12.5567 9.83456 12.3831 10.0013 12.1905 10.0013L6.47621 10.0013C6.28359 10.0013 6.10998 9.83456 6.03626 9.57882C5.96255 9.32308 6.00331 9.02872 6.1395 8.83298L8.82826 4.9686C9.1072 4.56776 9.55946 4.56776 9.83841 4.9686L12.5272 8.83298Z"
      fill={fill}
    />
  </svg>
);

export default CaretUp;

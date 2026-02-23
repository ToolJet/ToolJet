import React from 'react';

const Check2 = ({ fill = '#3E63DD', width = '16', className = '', viewBox = '0 0 16 16', height }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height || width}
      viewBox={viewBox}
      fill="none"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.2902 2.89912C14.7297 3.25872 14.7945 3.90656 14.4349 4.34608L7.43009 12.9988C6.37251 14.4157 5.35903 14.0098 4.48418 13.2443L1.68515 10.7952C1.25776 10.4212 1.21445 9.77157 1.58842 9.34418C1.96238 8.91679 2.612 8.87348 3.03939 9.24745L5.83842 11.6966L12.8432 3.04381C13.2028 2.60428 13.8506 2.5395 14.2902 2.89912Z"
        fill={fill}
      />
    </svg>
  );
};

export default Check2;

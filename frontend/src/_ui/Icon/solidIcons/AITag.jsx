import React from 'react';

const AITag = ({ fill = 'none', width = '12', height = '12', className = '', viewBox = '0 0 12 12' }) => {
  return (
    <svg
      width={width}
      height={height}
      fill={fill}
      className={className}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.36783 5.99998C4.31182 7.02317 5.28234 8.16244 5.99999 11C6.71764 8.16244 7.68814 7.02317 10.6321 5.99998C7.68814 4.97686 6.71764 3.83759 5.99999 1C5.28234 3.83759 4.31182 4.97686 1.36783 5.99998Z"
        fill="url(#paint0_linear_654_1335)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_654_1335"
          x1="11.5717"
          y1="-5.5"
          x2="-0.0865091"
          y2="-4.34623"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF5F6D" />
          <stop offset="1" stopColor="#FFC371" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default AITag;

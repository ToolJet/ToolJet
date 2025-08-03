import React from 'react';

const AlignHorizontalCenter = ({ fill = '', width = '25', className = '', viewBox = '0 0 25 25' }) => {
  return (
    <svg width={width} height={width} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M11.1538 1.15385C11.1538 0.516594 10.6372 0 10 0C9.36275 0 8.84615 0.516594 8.84615 1.15385V6.15385H2.30769C1.03318 6.15385 0 7.18703 0 8.46154V11.5385C0 12.813 1.03318 13.8462 2.30769 13.8462H8.84615V18.8462C8.84615 19.4834 9.36275 20 10 20C10.6372 20 11.1538 19.4834 11.1538 18.8462V13.8462H17.6923C18.9668 13.8462 20 12.813 20 11.5385V8.46154C20 7.18703 18.9668 6.15385 17.6923 6.15385H11.1538V1.15385Z"
        fill={fill}
      />
    </svg>
  );
};

export default AlignHorizontalCenter;

import React from 'react';

const AlignVerticallyBottom = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox="0 0 9 12" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.13226 1.48775C2.13226 0.758312 2.72357 0.166992 3.45301 0.166992H5.21402C5.94345 0.166992 6.53477 0.758312 6.53477 1.48775V8.07054C6.53477 8.79997 5.94345 9.39132 5.21402 9.39132H3.45301C2.72357 9.39132 2.13226 8.79997 2.13226 8.07054V1.48775ZM0.8115 10.5129C0.446787 10.5129 0.151123 10.8086 0.151123 11.1733C0.151123 11.538 0.446787 11.8337 0.8115 11.8337H7.85553C8.22023 11.8337 8.5159 11.538 8.5159 11.1733C8.5159 10.8086 8.22023 10.5129 7.85553 10.5129H0.8115Z"
        fill={fill}
      />
    </svg>
  );
};

export default AlignVerticallyBottom;

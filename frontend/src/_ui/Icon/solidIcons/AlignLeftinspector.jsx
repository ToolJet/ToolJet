import React from 'react';

const AlignLeftinspector = ({ fill = '', width = '25', className = '', viewBox = '0 0 25 25' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox="0 0 24 24" fill="none">
      <path
        d="M1.6 1.5334C1.6 1.09157 1.24183 0.733398 0.8 0.733398C0.358172 0.733398 0 1.09157 0 1.5334V16.4667C0 16.9086 0.358172 17.2667 0.8 17.2667C1.24183 17.2667 1.6 16.9086 1.6 16.4667V1.5334Z"
        fill={fill}
      />
      <path
        d="M3.46667 6.86673C3.46667 5.09942 4.89936 3.66673 6.66667 3.66673L16.8 3.66673C18.5673 3.66673 20 5.09942 20 6.86673V11.1334C20 12.9007 18.5673 14.3334 16.8 14.3334H6.66667C4.89936 14.3334 3.46667 12.9007 3.46667 11.1334V6.86673Z"
        fill={fill}
      />
    </svg>
  );
};

export default AlignLeftinspector;

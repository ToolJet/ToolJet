import React from 'react';

const AlignRightinspector = ({ fill = '', width = '25', className = '', viewBox = '0 0 25 25' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox="0 0 24 24" fill="none">
      <path
        d="M22 4.5334C22 4.09157 21.6418 3.7334 21.2 3.7334C20.7582 3.7334 20.4 4.09157 20.4 4.5334V19.4667C20.4 19.9086 20.7582 20.2667 21.2 20.2667C21.6418 20.2667 22 19.9086 22 19.4667V4.5334Z"
        fill={fill}
      />
      <path
        d="M18.5333 9.86673C18.5333 8.09942 17.1006 6.66673 15.3333 6.66673L5.2 6.66673C3.43269 6.66673 2 8.09942 2 9.86673V14.1334C2 15.9007 3.43269 17.3334 5.2 17.3334H15.3333C17.1006 17.3334 18.5333 15.9007 18.5333 14.1334V9.86673Z"
        fill={fill}
      />
    </svg>
  );
};

export default AlignRightinspector;

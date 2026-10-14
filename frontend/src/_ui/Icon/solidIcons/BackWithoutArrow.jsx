import React from 'react';
const BackWithoutArrow = ({ width = '32' }) => {
  return (
    <svg width={width} height={width} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8.58299 12.5893C8.25756 12.9147 7.72993 12.9147 7.4045 12.5893L2.69908 7.88384C2.21098 7.39574 2.21098 6.60425 2.69908 6.11607L7.4045 1.41073C7.72993 1.08531 8.25756 1.08531 8.58299 1.41073C8.90841 1.73615 8.90841 2.26379 8.58299 2.58921L4.1722 7L8.58299 11.4107C8.90841 11.7361 8.90841 12.2638 8.58299 12.5893Z"
        fill="#6A727C"
      />
    </svg>
  );
};

export default BackWithoutArrow;

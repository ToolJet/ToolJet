import React from 'react';

const AlignVerticallyCenter = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox="0 0 12 12" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.98559 0.419922C4.14515 0.419922 3.46385 1.10122 3.46385 1.94166V5.23876H0.927618C0.507405 5.23876 0.166748 5.57942 0.166748 5.99963C0.166748 6.41985 0.507405 6.7605 0.927618 6.7605H3.46385V10.0576C3.46385 10.898 4.14515 11.5793 4.98559 11.5793H7.01457C7.85501 11.5793 8.53631 10.898 8.53631 10.0576V6.7605H11.0725C11.4927 6.7605 11.8334 6.41985 11.8334 5.99963C11.8334 5.57942 11.4927 5.23876 11.0725 5.23876H8.53631V1.94166C8.53631 1.10122 7.85501 0.419922 7.01457 0.419922H4.98559Z"
        fill={fill}
      />
    </svg>
  );
};

export default AlignVerticallyCenter;

import React from 'react';

const AlignVerticallyTop = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width} viewBox="0 0 9 12" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.14475 1.48775C0.780039 1.48775 0.484375 1.19208 0.484375 0.82737C0.484375 0.462653 0.780039 0.166992 1.14475 0.166992H8.18878C8.55348 0.166992 8.84916 0.462653 8.84916 0.82737C8.84916 1.19208 8.55348 1.48775 8.18878 1.48775H1.14475ZM2.46551 10.5129C2.46551 11.2423 3.05683 11.8337 3.78626 11.8337H5.54727C6.2767 11.8337 6.86802 11.2423 6.86802 10.5129V3.93011C6.86802 3.20068 6.2767 2.60936 5.54727 2.60936H3.78626C3.05683 2.60936 2.46551 3.20068 2.46551 3.93011V10.5129Z"
        fill={fill}
      />
    </svg>
  );
};

export default AlignVerticallyTop;

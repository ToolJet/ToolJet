import React from 'react';

const EnterpriseGradient = ({ fill = '#FFEDD4', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg width={width} height={width} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="4" transform="matrix(-1 0 0 1 48 0)" fill={fill} />
    <path
      d="M19.8908 25.4869C24.3744 27.0451 25.8524 28.7802 26.9454 33.1017C28.0383 28.7802 29.5164 27.0451 34 25.4869C29.5164 23.9287 28.0383 22.1936 26.9454 17.8721C25.8524 22.1936 24.3744 23.9287 19.8908 25.4869Z"
      fill="url(#paint0_linear_3782_9222)"
    />
    <path
      opacity="0.6"
      d="M14.3289 18.2783C16.8581 19.1537 17.6917 20.1286 18.3083 22.5565C18.9248 20.1286 19.7586 19.1537 22.2876 18.2783C19.7586 17.4028 18.9248 16.428 18.3083 14C17.6917 16.428 16.8581 17.4028 14.3289 18.2783Z"
      fill="url(#paint1_linear_3782_9222)"
    />
    <path
      opacity="0.6"
      d="M13.9998 30.8999C15.8717 31.5343 16.4888 32.2407 16.9452 34.0001C17.4015 32.2407 18.0186 31.5343 19.8906 30.8999C18.0186 30.2655 17.4015 29.5592 16.9452 27.7998C16.4888 29.5592 15.8717 30.2655 13.9998 30.8999Z"
      fill="url(#paint2_linear_3782_9222)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_3782_9222"
        x1="35.4309"
        y1="7.97279"
        x2="17.6759"
        y2="9.72995"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FF5F6D" />
        <stop offset="1" stop-color="#FFC371" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_3782_9222"
        x1="23.0947"
        y1="8.43827"
        x2="13.0803"
        y2="9.43332"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FF5F6D" />
        <stop offset="1" stop-color="#FFC371" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_3782_9222"
        x1="20.488"
        y1="23.7696"
        x2="13.0787"
        y2="24.5216"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FF5F6D" />
        <stop offset="1" stop-color="#FFC371" />
      </linearGradient>
    </defs>
  </svg>
);

export default EnterpriseGradient;

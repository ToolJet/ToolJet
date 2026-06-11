import React from 'react';

const Subtract = ({ fill = '#C1C8CD', width = '21', className = '', viewBox = '0 0 21 21' }) => (
  <svg width={width} height={width} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.5 0.789062H4.5C2.29086 0.789062 0.5 2.57992 0.5 4.78906V16.7891C0.5 18.9982 2.29086 20.7891 4.5 20.7891H16.5C18.7091 20.7891 20.5 18.9982 20.5 16.7891V4.78906C20.5 2.57992 18.7091 0.789062 16.5 0.789062ZM14.5 11.5391C14.9142 11.5391 15.25 11.2033 15.25 10.7891C15.25 10.3748 14.9142 10.0391 14.5 10.0391H6.5C6.08579 10.0391 5.75 10.3748 5.75 10.7891C5.75 11.2033 6.08579 11.5391 6.5 11.5391H14.5Z"
      fill={fill}
      className={className}
    />
  </svg>
);

export default Subtract;

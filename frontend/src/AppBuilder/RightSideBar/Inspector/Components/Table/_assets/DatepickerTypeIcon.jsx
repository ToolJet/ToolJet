import React from 'react';

const DatepickerTypeIcon = ({
  fill = '#ACB2B9',
  width = '16',
  className = '',
  viewBox = '0 0 16 16',
  style,
  height,
}) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.83333 1.81518C5.83333 1.54902 5.60948 1.33325 5.33333 1.33325C5.05719 1.33325 4.83333 1.54902 4.83333 1.81518V2.77904H4.66667C3.19391 2.77904 2 3.92979 2 5.34932V5.83124H14V5.34932C14 3.92979 12.8061 2.77904 11.3333 2.77904H11.1667V1.81518C11.1667 1.54902 10.9428 1.33325 10.6667 1.33325C10.3905 1.33325 10.1667 1.54902 10.1667 1.81518V2.77904H5.83333V1.81518ZM2 6.7951H14V12.0963C14 13.5158 12.8061 14.6666 11.3333 14.6666H4.66667C3.19391 14.6666 2 13.5158 2 12.0963V6.7951Z"
      fill={fill}
    />
  </svg>
);

export default DatepickerTypeIcon;

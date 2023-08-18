import React from 'react';

export const BaseUrl = ({ dataSourceURL, theme }) => {
  return (
    <span
      className="col-auto"
      htmlFor=""
      style={{
        padding: '5px',
        border: theme === 'default' ? '1px solid rgb(217 220 222)' : '1px solid white',
        borderRightWidth: 0,
        background: theme === 'default' ? 'rgb(246 247 251)' : '#20211e',
        color: theme === 'default' ? '#9ca1a6' : '#9e9e9e',
        height: '32px',
        borderRadius: '6px 0 0 6px',
      }}
    >
      {dataSourceURL}
    </span>
  );
};

import React from 'react';

export const BaseUrl = ({ dataSourceURL, theme }) => {
  return (
    <span
      className="col-auto"
      htmlFor=""
      style={{
        padding: '5px',
        border: theme === 'default' ? '1px solid rgb(217 220 222)' : '1px solid white',
        background: theme === 'default' ? 'rgb(246 247 251)' : '#20211e',
        color: theme === 'default' ? '#9ca1a6' : '#9e9e9e',
        height: '32px',
      }}
    >
      {dataSourceURL}
    </span>
  );
};

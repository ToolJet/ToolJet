import React from 'react';

export const BaseUrl = ({ dataSourceURL, theme }) => {
  return (
    <span
      htmlFor=""
      style={{
        padding: '7px',
        border: theme === 'default' ? '1px solid rgb(217 220 222)' : '1px solid #2c3a4c',
        background: theme === 'default' ? 'rgb(246 247 251)' : '#20211e',
        color: theme === 'default' ? '#9ca1a6' : '#9e9e9e',
        marginRight: '-3px',
        borderTopLeftRadius: '3px',
        borderBottomLeftRadius: '3px',
        zIndex: 1,
      }}
    >
      {dataSourceURL}
    </span>
  );
};

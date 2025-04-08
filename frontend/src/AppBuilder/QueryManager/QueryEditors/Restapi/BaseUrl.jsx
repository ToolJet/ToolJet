import React from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

export const BaseUrl = ({ dataSourceURL, theme, className = 'col-auto', style = {} }) => {
  return (
    <span
      className={`${className} base-url-container`}
      style={{
        padding: '5px',
        border: theme === 'default' ? '1px solid rgb(217 220 222)' : '1px solid white',
        borderRightWidth: 0,
        background: theme === 'default' ? 'rgb(246 247 251)' : '#20211e',
        color: theme === 'default' ? '#9ca1a6' : '#9e9e9e',
        borderRadius: '6px 0 0 6px',
        display: 'flex',
        transition: 'height 0.2s ease',
        ...style,
      }}
    >
      <OverflowTooltip
        text={dataSourceURL}
        width="559px"
        whiteSpace="normal"
        placement="auto"
        style={{ height: '100%' }}
      >
        {dataSourceURL}
      </OverflowTooltip>
    </span>
  );
};

import React from 'react';

export const Icon = ({ properties, styles, fireEvent }) => {
  const { iconPicker } = properties;
  const { iconColor, iconSize, iconAlign, disabledState, visibility } = styles;
  const computedStyles = {
    fontSize: iconSize,
    iconAlign,
    display: visibility ? '' : 'none',
  };

  return (
    <div data-disabled={disabledState} className={`icon-widget`} style={computedStyles}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon icon-tabler icon-tabler-letter-i"
        width="44"
        height="44"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="#2c3e50"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={(event) => {
          event.stopPropagation();
          fireEvent('onHover');
        }}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    </div>
  );
};

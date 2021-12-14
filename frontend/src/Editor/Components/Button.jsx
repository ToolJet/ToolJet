import React from 'react';
var tinycolor = require('tinycolor2');

export const Button = function Button({ height, properties, styles, fireEvent }) {
  const { loadingState, text } = properties;
  const { backgroundColor, textColor, borderRadius, visibility, disabledState } = styles;

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visibility ? '' : 'none',
    '--tblr-btn-color-darker': tinycolor(backgroundColor).darken(8).toString(),
  };

  return (
    <button
      disabled={disabledState}
      className={`jet-button btn btn-primary p-1 ${loadingState === true ? ' btn-loading' : ''}`}
      style={computedStyles}
      onClick={(event) => {
        event.stopPropagation();
        fireEvent('onClick');
      }}
    >
      {text}
    </button>
  );
};

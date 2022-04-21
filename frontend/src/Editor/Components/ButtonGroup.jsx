import React from 'react';
import cx from 'classnames';

export const ButtonGroup = function Button({ height, properties, styles, fireEvent }) {
  const { loadingState, text } = properties;
  const { backgroundColor, textColor, borderRadius, visibility, disabledState } = styles;

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visibility ? '' : 'none',
  };

  return (
    <div className="widget-button">
      <button
        disabled={disabledState}
        className={cx('jet-button btn btn-primary p-1 overflow-hidden', {
          'btn-loading': loadingState,
        })}
        style={computedStyles}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
      >
        {text}
      </button>
    </div>
  );
};

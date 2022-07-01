import React, { useEffect, useState } from 'react';
import cx from 'classnames';
var tinycolor = require('tinycolor2');

export const Button = function Button({ height, properties, styles, fireEvent, registerAction }) {
  const { loadingState, text } = properties;
  const { backgroundColor, textColor, borderRadius, visibility, disabledState, loaderColor } = styles;

  const [label, setLabel] = useState(text);
  useEffect(() => setLabel(text), [text]);

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visibility ? '' : 'none',
    '--tblr-btn-color-darker': tinycolor(backgroundColor).darken(8).toString(),
    '--loader-color': tinycolor(loaderColor ?? '#fff').toString(),
  };

  registerAction('click', async function () {
    fireEvent('onClick');
  });

  registerAction('setLabel', async function (label) {
    setLabel(label);
  });

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
        data-cy="button-widget"
      >
        {label}
      </button>
    </div>
  );
};

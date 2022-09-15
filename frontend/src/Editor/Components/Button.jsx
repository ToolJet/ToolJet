import React, { useEffect, useState } from 'react';
import cx from 'classnames';
var tinycolor = require('tinycolor2');

export const Button = function Button({ height, properties, styles, fireEvent, registerAction, component }) {
  const { backgroundColor, textColor, borderRadius, loaderColor, disabledState } = styles;

  const [label, setLabel] = useState(properties.text);
  useEffect(() => setLabel(properties.text), [properties.text]);

  const [disable, setDisable] = useState(disabledState);
  useEffect(() => {
    setDisable(disabledState);
  }, [disabledState]);

  const [visibility, setVisibility] = useState(styles.visibility);
  useEffect(() => {
    setVisibility(styles.visibility);
  }, [styles.visibility]);

  const [loading, setLoading] = useState(properties.loadingState);
  useEffect(() => {
    setLoading(properties.loadingState);
  }, [properties.loadingState]);

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visibility ? 'flex' : 'none',
    '--tblr-btn-color-darker': tinycolor(backgroundColor).darken(8).toString(),
    '--loader-color': tinycolor(loaderColor ?? '#fff').toString(),
  };

  registerAction('click', async function () {
    fireEvent('onClick');
  });

  registerAction('setLabel', async function (text) {
    setLabel(text);
  });

  registerAction('disable', async function (value) {
    setDisable(value);
  });

  registerAction('visibility', async function (value) {
    setVisibility(value);
  });

  registerAction('loading', async function (value) {
    setLoading(value);
  });

  return (
    <div className="widget-button">
      <button
        disabled={disable}
        className={cx('jet-button btn btn-primary p-1 overflow-hidden', {
          'btn-loading': loading,
        })}
        style={computedStyles}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseMove={(event) => {
          event.stopPropagation();
          fireEvent('onHover');
        }}
        data-cy={`draggable-widget-${String(component.name).toLowerCase()}`}
      >
        {label}
      </button>
    </div>
  );
};

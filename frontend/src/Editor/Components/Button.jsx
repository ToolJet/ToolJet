import React, { useEffect, useState } from 'react';
import cx from 'classnames';
var tinycolor = require('tinycolor2');

export const Button = function Button({ height, properties, styles, fireEvent, registerAction, component }) {
  const { backgroundColor, textColor, borderRadius, loaderColor } = styles;

  const [label, setLabel] = useState(properties.label);
  useEffect(() => setLabel(properties.label), [properties.label]);

  const [disable, setDisable] = useState(properties.disable);
  useEffect(() => {
    setDisable(properties.disable);
  }, [properties.disable]);

  const [hidden, setHidden] = useState(properties.hidden);
  useEffect(() => {
    setHidden(properties.hidden);
  }, [properties.hidden]);

  const [loading, setLoading] = useState(properties.loading);
  useEffect(() => {
    setLoading(properties.loading);
  }, [properties.loading]);

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: hidden ? 'none' : 'flex',
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

  registerAction('hide', async function (value) {
    setHidden(value);
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

import React, { useEffect, useState } from 'react';
import cx from 'classnames';
var tinycolor = require('tinycolor2');

export const Button = function Button({ height, properties, styles, fireEvent, registerAction, component }) {
  const { loadingState, text, visibility, disabledState } = properties;
  const { backgroundColor, textColor, borderRadius, loaderColor } = styles;
  console.log(disabledState, 'disabledState');
  const [label, setLabel] = useState(text);
  useEffect(() => setLabel(text), [text]);

  const [disable, setDisable] = useState(disabledState);
  useEffect(() => {
    console.log('inside use effect');
    console.log(disabledState, 'disabledState inside useEffect');
    setDisable(disabledState);
  }, [disabledState]);

  const [visible, setVisible] = useState(visibility);
  useEffect(() => {
    setVisible(visibility);
  }, [visibility]);

  const [loading, setLoading] = useState(loadingState);
  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visible ? '' : 'none',
    '--tblr-btn-color-darker': tinycolor(backgroundColor).darken(8).toString(),
    '--loader-color': tinycolor(loaderColor ?? '#fff').toString(),
  };

  registerAction('click', async function () {
    fireEvent('onClick');
  });

  registerAction('setText', async function (text) {
    setLabel(text);
  });

  registerAction('disable', async function (value) {
    setDisable(value);
  });

  registerAction('visible', async function (value) {
    setVisible(value);
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

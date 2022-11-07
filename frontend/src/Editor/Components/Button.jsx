import React, { useEffect, useState } from 'react';
import cx from 'classnames';
var tinycolor = require('tinycolor2');

export const Button = function Button({ height, properties, styles, fireEvent, registerAction, component }) {
  const { backgroundColor, textColor, borderRadius, loaderColor, disabledState, borderColor } = styles;

  const [label, setLabel] = useState(properties.text);
  const [disable, setDisable] = useState(disabledState);
  const [visibility, setVisibility] = useState(styles.visibility);
  const [loading, setLoading] = useState(properties.loadingState);

  useEffect(() => setLabel(properties.text), [properties.text]);

  useEffect(() => {
    disable !== disabledState && setDisable(disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    visibility !== styles.visibility && setVisibility(styles.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles.visibility]);

  useEffect(() => {
    loading !== properties.loadingState && setLoading(properties.loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visibility ? '' : 'none',
    '--tblr-btn-color-darker': tinycolor(backgroundColor).darken(8).toString(),
    '--loader-color': tinycolor(loaderColor ?? '#fff').toString(),
    borderColor: borderColor,
  };

  registerAction('click', async function () {
    fireEvent('onClick');
  });

  registerAction(
    'setText',
    async function (text) {
      setLabel(text);
    },
    [setLabel]
  );

  registerAction(
    'disable',
    async function (value) {
      setDisable(value);
    },
    [setDisable]
  );

  registerAction(
    'visibility',
    async function (value) {
      setVisibility(value);
    },
    [setVisibility]
  );

  registerAction(
    'loading',
    async function (value) {
      setLoading(value);
    },
    [setLoading]
  );

  const hasCustomBackground = backgroundColor.charAt() === '#';
  if (hasCustomBackground) {
    computedStyles['--tblr-btn-color-darker'] = tinycolor(backgroundColor).darken(8).toString();
  }

  return (
    <div className="widget-button">
      <button
        disabled={disable}
        className={cx('jet-button btn btn-primary p-1 overflow-hidden', {
          'btn-loading': loading,
          'btn-custom': hasCustomBackground,
        })}
        style={computedStyles}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={() => {
          fireEvent('onHover');
        }}
        data-cy={`draggable-widget-${String(component.name).toLowerCase()}`}
      >
        {label}
      </button>
    </div>
  );
};

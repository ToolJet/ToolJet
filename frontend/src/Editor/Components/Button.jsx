import React, { useEffect, useState } from 'react';
import cx from 'classnames';
var tinycolor = require('tinycolor2');

export const Button = function Button(props) {
  const { height, properties, styles, fireEvent, id, dataCy, setExposedVariable } = props;
  const { backgroundColor, textColor, borderRadius, loaderColor, disabledState, borderColor, boxShadow } = styles;

  const [label, setLabel] = useState(properties.text);
  const [disable, setDisable] = useState(disabledState);
  const [visibility, setVisibility] = useState(styles.visibility);
  const [loading, setLoading] = useState(properties.loadingState);

  useEffect(() => {
    setLabel(properties.text);
    setExposedVariable('buttonText', properties.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.text]);

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
    boxShadow: boxShadow,
  };

  useEffect(() => {
    const exposedVariables = {
      allVariables: {
        click: async function () {
          if (!disable) {
            fireEvent('onClick');
          }
        },
        setText: async function (text) {
          setLabel(text);
          setExposedVariable('buttonText', text);
        },
        disable: async function (value) {
          setDisable(value);
        },
        visibility: async function (value) {
          setVisibility(value);
        },
        loading: async function (value) {
          setLoading(value);
        },
      },
    };

    setExposedVariable('allVariables', exposedVariables.allVariables);

    // Clean up the exposed variables when the component unmounts
    return () => {
      setExposedVariable('allVariables', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable, setLabel, setDisable, setVisibility, setLoading]);

  const hasCustomBackground = backgroundColor?.charAt() === '#';
  if (hasCustomBackground) {
    computedStyles['--tblr-btn-color-darker'] = tinycolor(backgroundColor).darken(8).toString();
  }

  const handleClick = () => {
    const event1 = new CustomEvent('submitForm', { detail: { buttonComponentId: id } });
    document.dispatchEvent(event1);
    fireEvent('onClick');
  };

  return (
    <div className="widget-button">
      <button
        disabled={disable}
        className={cx('jet-button btn btn-primary p-1 overflow-hidden', {
          'btn-loading': loading,
          'btn-custom': hasCustomBackground,
        })}
        style={computedStyles}
        onClick={handleClick}
        onMouseOver={() => {
          fireEvent('onHover');
        }}
        data-cy={dataCy}
        type="default"
      >
        {label}
      </button>
    </div>
  );
};

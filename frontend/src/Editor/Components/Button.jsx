import React, { useEffect, useState } from 'react';
import cx from 'classnames';
const tinycolor = require('tinycolor2');
import { ToolTip } from '@/_components/ToolTip';
import * as Icons from '@tabler/icons-react';

export const Button = function Button(props) {
  const { height, properties, styles, fireEvent, id, dataCy, setExposedVariable, setExposedVariables } = props;
  const {
    backgroundColor,
    textColor,
    borderRadius,
    loaderColor,
    borderColor,
    boxShadow,
    iconColor,
    padding,
    direction,
    iconVisibility,
  } = styles;
  const { loadingState, tooltip, disabledState } = properties;
  const [label, setLabel] = useState(properties.text);
  const [disable, setDisable] = useState(disabledState || loadingState);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(loadingState);
  const iconName = styles.icon; // Replace with the name of the icon you want

  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];

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
    visibility !== properties.visibility && setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

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
    padding: '2px 4px',
  };

  useEffect(() => {
    const exposedVariables = {
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
      setDisable: async function (value) {
        setDisable(value);
        setExposedVariable('isDisabled', value);
      },
      setVisibility: async function (value) {
        setVisibility(value);
        setExposedVariable('isVisible', value);
      },
      setLoading: async function (value) {
        setLoading(value);
        setExposedVariable('isLoading', value);
      },
    };

    setExposedVariables(exposedVariables);

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
  const renderInput = () => (
    <div
      className="widget-button"
      style={{
        padding: padding === 'default' ? '2px' : '',
        position: 'relative',
      }}
    >
      <button
        disabled={disable || loading}
        className={cx('jet-button overflow-hidden btn', {
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
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            flexDirection: direction == 'right' ? 'row-reverse' : 'row',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              maxHeight: '100%',
              overflow: 'hidden',
              marginLeft: direction == 'right' && iconVisibility && '3px',
              marginRight: direction == 'left' && iconVisibility && '3px',
            }}
          >
            <span style={{ maxWidth: ' 100%', minWidth: '0' }}>
              <p className="tj-text-xsm" style={{ fontWeight: '500', margin: '0px', padding: '0px' }}>
                {label}
              </p>
            </span>
          </div>
          <div className="d-flex">
            {props.component?.definition?.styles?.iconVisibility?.value && !props.isResizing && !loading && (
              <IconElement
                style={{
                  width: '14px',
                  height: '14px',
                  color: iconColor,
                }}
                stroke={1.5}
              />
            )}
          </div>
        </div>
      </button>
    </div>
  );

  return (
    <>
      {tooltip?.length > 0 ? (
        <ToolTip message={tooltip}>
          <div>{renderInput()}</div>
        </ToolTip>
      ) : (
        <div>{renderInput()}</div>
      )}
    </>
  );
};

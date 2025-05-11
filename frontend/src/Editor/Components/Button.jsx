import React, { useEffect, useState } from 'react';
import cx from 'classnames';
const tinycolor = require('tinycolor2');
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';

import { getModifiedColor } from './utils';

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
    direction,
    type,
    padding,
    iconVisibility,
  } = styles;

  const { loadingState, disabledState } = properties;
  const [label, setLabel] = useState(typeof properties.text === 'string' ? properties.text : '');
  const [disable, setDisable] = useState(disabledState || loadingState);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(loadingState);
  const [hovered, setHovered] = useState(false);
  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];

  useEffect(() => {
    if (typeof properties.text === 'string') {
      setLabel(properties.text);
      setExposedVariable('buttonText', properties.text);
    }
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

  const computedIconColor =
    '#FFFFFF' === iconColor ? (type === 'primary' ? iconColor : 'var(--icons-strong)') : iconColor;

  const computedBorderColor =
    borderColor === '#4368E3' ? (type === 'primary' ? '#4368E3' : 'var(--borders-strong)') : borderColor;

  const computedTextColor =
    '#FFFFFF' === textColor ? (type === 'primary' ? 'var(--text-on-solid)' : 'var(--text-primary)') : textColor;
  const computedLoaderColor =
    '#FFFFFF' === loaderColor ? (type === 'primary' ? loaderColor : 'var(--cc-primary-brand)') : loaderColor;

  const computedBgColor =
    '#4368E3' === backgroundColor
      ? type === 'primary'
        ? 'var(--cc-primary-brand)'
        : 'transparent'
      : type === 'primary'
        ? backgroundColor
        : 'transparent';

  const computedStyles = {
    backgroundColor: computedBgColor,
    color: computedTextColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    '--tblr-btn-color-darker': getModifiedColor(computedBgColor, 'hover'),
    '--tblr-btn-color-clicked': getModifiedColor(computedBgColor, 'active'),
    '--loader-color': tinycolor(computedLoaderColor ?? 'var(--icons-on-solid)').toString(),
    borderColor: computedBorderColor,
    boxShadow: type == 'primary' && boxShadow,
    padding: '0px 12px',
    // cursor: 'pointer',
    opacity: disable && '50%',
    display: visibility ? (loading ? 'flex' : '') : 'none',
    justifyContent: 'center',
    alignItems: 'center',
  };

  useEffect(() => {
    const exposedVariables = {
      click: async function () {
        if (!disable && !loading) {
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
    };

    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

  useEffect(() => {
    setExposedVariable('setLoading', async function (loading) {
      setLoading(loading);
      setExposedVariable('isLoading', loading);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      setVisibility(state);
      setExposedVariable('isVisible', state);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    setExposedVariable('setDisable', async function (disable) {
      setDisable(disable);
      setExposedVariable('isDisabled', disable);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariable('isLoading', loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('isDisabled', disable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

  useEffect(() => {
    if (hovered) {
      fireEvent('onHover');
    }
  }, [hovered]);

  const handleClick = () => {
    if (!disable && !loading) {
      const event1 = new CustomEvent('submitForm', { detail: { buttonComponentId: id } });
      document.dispatchEvent(event1);
      fireEvent('onClick');
    }
  };
  const renderButton = () => (
    <div
      className={`widget-button d-flex align-items-center`}
      style={{
        position: 'relative',
        // height,
      }}
      disabled={disable || loading}
    >
      <button
        className={cx('overflow-hidden jet-btn')}
        style={computedStyles}
        onClick={handleClick}
        data-cy={dataCy}
        type="default"
        onMouseOver={() => {
          //cannot use mouseEnter here since mouse enter does not trigger consistently. Mouseover gets triggered for all child components
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
      >
        {!loading ? (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: !loading ? 'flex' : 'none',
              alignItems: 'center',
              flexDirection: direction == 'left' ? 'row-reverse' : 'row',
              justifyContent: 'center',
              gap: label?.length > 0 && '6px',
            }}
          >
            <div
              style={{
                overflow: 'hidden',
              }}
            >
              <span style={{ maxWidth: ' 100%', minWidth: '0' }}>
                <p
                  className="tj-text-sm"
                  style={{ fontWeight: '500', margin: '0px', padding: '0px', color: computedTextColor }}
                >
                  {label}
                </p>
              </span>
            </div>
            {iconVisibility && (
              <div className="d-flex">
                {!props.isResizing && !loading && (
                  <IconElement
                    style={{
                      width: '16px',
                      height: '16px',
                      color: computedIconColor,
                    }}
                    stroke={1.5}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <Loader color={computedLoaderColor} width="16" />
        )}
      </button>
    </div>
  );

  return <>{renderButton()}</>;
};

import React, { useEffect, useState } from 'react';
import cx from 'classnames';
const tinycolor = require('tinycolor2');
import Loader from '@/ToolJetUI/Loader/Loader';
import TablerIcon from '@/_ui/Icon/TablerIcon';

import { getModifiedColor, getSafeRenderableValue } from './utils';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { buttonExposure } from '@/AppBuilder/_engines/materialize/widgets/Button';

const { actions } = buttonExposure;

export const Button = function Button(props) {
  const { height, properties, styles, fireEvent, id, dataCy, setExposedVariable, setExposedVariables } = props;
  const {
    backgroundColor,
    hoverBackgroundMode,
    hoverBackgroundColor,
    textColor,
    textSize = 14,
    fontWeight,
    borderRadius,
    loaderColor,
    borderColor,
    boxShadow,
    iconColor,
    direction,
    contentAlignment,
    type,
    padding,
    iconVisibility,
  } = styles;
  const moduleId = useModuleId();

  const { loadingState, disabledState } = properties;
  const exposure = buttonExposure.initial({ properties, styles });
  const [label, setLabel] = useState(exposure.buttonText ?? '');
  // Disabled while loading too, until the disabledState effect settles it to exposure.isDisabled.
  const [disable, setDisable] = useState(exposure.isDisabled || exposure.isLoading);
  const [visibility, setVisibility] = useState(exposure.isVisible);
  const [loading, setLoading] = useState(exposure.isLoading);
  const [hovered, setHovered] = useState(false);
  const iconName = styles.icon; // Replace with the name of the icon you want

  useEffect(() => {
    if ('buttonText' in exposure) {
      setLabel(exposure.buttonText);
      setExposedVariable('buttonText', exposure.buttonText);
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
    '#FFFFFF' === textColor ? (type === 'primary' ? 'var(--text-on-solid)' : 'var(--cc-primary-text)') : textColor;
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

  const computedHoverBgColor =
    type === 'primary'
      ? hoverBackgroundMode === 'manual'
        ? hoverBackgroundColor || getModifiedColor(computedBgColor, 'hover')
        : getModifiedColor(computedBgColor, 'hover')
      : 'transparent';
  const normalizedTextSize = Number(textSize);
  const computedFontSize = Number.isFinite(normalizedTextSize) ? normalizedTextSize : 14;
  const computedLineHeight = computedFontSize * 1.42;
  const computedIconSize = computedLineHeight * 0.8;
  const normalizedFontWeight = fontWeight === 'medium' ? 500 : fontWeight;
  const computedFontWeight = normalizedFontWeight ? normalizedFontWeight : normalizedFontWeight === '0' ? 0 : 'normal';
  const isReverseDirection = direction === 'left';
  const computedContentAlignment =
    {
      left: isReverseDirection ? 'flex-end' : 'flex-start',
      center: 'center',
      right: isReverseDirection ? 'flex-start' : 'flex-end',
    }[contentAlignment] ?? 'center';

  const computedStyles = {
    backgroundColor: computedBgColor,
    color: computedTextColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    '--tblr-btn-color-darker': computedHoverBgColor,
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

  const canClick = !disable && !loading;

  useEffect(() => {
    const exposedVariables = {
      click: async function () {
        if (canClick) {
          fireEvent('onClick');
        }
      },
      setText: async function (text) {
        const { buttonText } = actions.setText(undefined, [text]);
        setLabel(buttonText);
        setExposedVariable('buttonText', buttonText);
      },
      disable: async function (value) {
        setDisable(actions.disable(undefined, [value]).isDisabled);
      },
      visibility: async function (value) {
        setVisibility(actions.visibility(undefined, [value]).isVisible);
      },
      loading: async function (value) {
        setLoading(actions.loading(undefined, [value]).isLoading);
      },
    };

    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

  useEffect(() => {
    setExposedVariable('setLoading', async function (loading) {
      const { isLoading } = actions.setLoading(undefined, [loading]);
      setLoading(isLoading);
      setExposedVariable('isLoading', isLoading);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      const { isVisible } = actions.setVisibility(undefined, [state]);
      setVisibility(isVisible);
      setExposedVariable('isVisible', isVisible);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    setExposedVariable('setDisable', async function (disable) {
      const { isDisabled } = actions.setDisable(undefined, [disable]);
      setDisable(isDisabled);
      setExposedVariable('isDisabled', isDisabled);
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
      const event1 = new CustomEvent('submitForm', { detail: { buttonComponentId: id, buttonModuleId: moduleId } });
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
        data-cy={`${generateCypressDataCy(dataCy)}-button`}
        type="default"
        onMouseOver={() => {
          //cannot use mouseEnter here since mouse enter does not trigger consistently. Mouseover gets triggered for all child components
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
        aria-label={label}
        id={`component-${id}`}
        aria-disabled={disable}
        aria-busy={loading}
        aria-hidden={!visibility}
      >
        {!loading ? (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: !loading ? 'flex' : 'none',
              alignItems: 'center',
              flexDirection: direction == 'left' ? 'row-reverse' : 'row',
              justifyContent: computedContentAlignment,
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
                  style={{
                    fontWeight: computedFontWeight,
                    fontSize: `${computedFontSize}px`,
                    lineHeight: `${computedLineHeight}px`,
                    margin: '0px',
                    padding: '0px',
                    color: computedTextColor,
                  }}
                  data-cy={`${dataCy}-label`}
                >
                  {getSafeRenderableValue(label)}
                </p>
              </span>
            </div>
            {iconVisibility && (
              <div className="d-flex">
                {!props.isResizing && !loading && (
                  <TablerIcon
                    iconName={iconName}
                    style={{
                      width: `${computedIconSize}px`,
                      height: `${computedIconSize}px`,
                      color: computedIconColor,
                    }}
                    stroke={1.5}
                    data-cy={`${dataCy}-icon`}
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

import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
const tinycolor = require('tinycolor2');
import Loader from '@/ToolJetUI/Loader/Loader';
import TablerIcon from '@/_ui/Icon/TablerIcon';

import { getModifiedColor, getSafeRenderableValue } from './utils';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export const Button = function Button(props) {
  const { height, properties, styles, fireEvent, id, dataCy, setExposedVariables, componentType, resolveIndex } = props;
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
  const isInitialRender = useRef(true);
  const [hovered, setHovered] = useState(false);
  const iconName = styles.icon; // Replace with the name of the icon you want

  /* ── Controlled reads: store is the source of truth, resolved properties
     are the pre-first-publish fallback ─────────────────────────────────── */
  const exposedOpts = { resolveIndex, moduleId: props.moduleId };
  const label = useExposedVariable(
    id,
    'buttonText',
    exposedOpts,
    typeof properties.text === 'string' ? properties.text : ''
  );
  const disable = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState || loadingState);
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);
  const loading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);

  const { dispatch, csaShims, useEffects } = useComponentCommands({
    id,
    componentType,
    moduleId: props.moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  const canClick = !disable && !loading;
  const canClickRef = useRef(canClick);
  canClickRef.current = canClick;

  // Bucket C: exposed `click` fires onClick only when enabled (old CSA guard);
  // it never dispatches the form-submit DOM event — only real clicks do.
  useEffects({
    click: () => {
      if (canClickRef.current) dispatch([{ kind: 'FIRE_EVENT', componentId: id, event: 'onClick' }]);
    },
  });

  /* ── Property-change write-throughs (skip-initial; the mount snapshot
     publishes first values) ────────────────────────────────────────────── */
  useEffect(() => {
    if (isInitialRender.current) return;
    if (typeof properties.text === 'string') {
      setExposedVariables({ buttonText: properties.text });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.text]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isDisabled: disabledState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isVisible: properties.visibility });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isLoading: properties.loadingState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  /* ── Mount snapshot: initial exposed values + contract-generated CSA
     dispatchers (setText/setLoading/setVisibility/setDisable/click + the
     deprecated loading/visibility/disable aliases) ─────────────────────── */
  useEffect(() => {
    setExposedVariables({
      ...(typeof properties.text === 'string' && { buttonText: properties.text }),
      isLoading: loadingState,
      isVisible: properties.visibility,
      isDisabled: disabledState || loadingState,
      ...csaShims(),
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (hovered) {
      fireEvent('onHover');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered]);

  const handleClick = () => {
    if (!disable && !loading) {
      const event1 = new CustomEvent('submitForm', { detail: { buttonComponentId: id, buttonModuleId: moduleId } });
      document.dispatchEvent(event1);
      dispatch([{ kind: 'FIRE_EVENT', componentId: id, event: 'onClick' }]);
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

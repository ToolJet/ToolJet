import React, { useRef, useEffect, useState } from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { getModifiedColor } from '../utils';
import './link.scss';

export const Link = ({
  id,
  height,
  width,
  properties,
  styles,
  fireEvent,
  setExposedVariables,
  dataCy,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
}) => {
  const { linkTarget, linkText, targetType, visibility, disabledState, loadingState } = properties;
  const { textColor, textSize, underline, boxShadow, verticalAlignment, horizontalAlignment, icon, iconVisibility } =
    styles;
  const clickRef = useRef();
  const wrapperRef = useRef(null);
  const [linkTargetState, setLinkTargetState] = useState(linkTarget);
  const [linkTextState, setLinkTextState] = useState(linkText);
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const [isLoading, setIsLoading] = useState(false);

  // ===== DYNAMIC HEIGHT =====
  // Grows when the link text wraps to multiple lines. Wrapping depends on width and
  // text length, so observe the rendered widget. Enabled only in view mode.
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const heightChangeValue = useHeightObserver(wrapperRef, isDynamicHeightEnabled);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility: isVisible,
    subContainerIndex,
    componentType,
  });

  const computedStyles = {
    display: 'flex',
    alignItems: verticalAlignment === 'top' ? 'flex-start' : verticalAlignment === 'center' ? 'center' : 'flex-end',
    textAlign: horizontalAlignment === 'left' ? 'left' : horizontalAlignment === 'center' ? 'center' : 'right',
    height: isDynamicHeightEnabled ? 'auto' : '100%',
    ...(isDynamicHeightEnabled && { minHeight: height }),
    width: '100%',
    boxShadow,
    opacity: isDisabled ? 0.5 : 1,
    pointerEvents: isDisabled ? 'none' : 'auto',
    fontWeight: '500',
    '--link-hover-color': getModifiedColor(textColor, 'hover'),
  };
  const iconSize = textSize + 2;
  // Update the state when the linkTarget or linkText changes
  useEffect(() => {
    setLinkTargetState(linkTarget);
    setLinkTextState(linkText);
  }, [linkTarget, linkText]);

  // Update the exposed variables when the linkTarget or linkText changes
  useEffect(() => {
    const exposedVariables = {
      linkTarget: linkTargetState,
      linkText: linkTextState,
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkTargetState, linkTextState]);

  useEffect(() => {
    setIsVisible(visibility);
    setIsDisabled(disabledState);
    setIsLoading(loadingState);
    const exposedVariables = {
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState,
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility, disabledState, loadingState]);

  // Update the exposed functions on mount
  useEffect(() => {
    const exposedVariables = {
      click: async function () {
        clickRef.current.click();
      },
      setVisibility: async function (value) {
        setIsVisible(!!value);
        setExposedVariables({
          isVisible: !!value,
        });
      },
      setDisable: async function (value) {
        setIsDisabled(!!value);
        setExposedVariables({
          isDisabled: !!value,
        });
      },
      setLoading: async function (value) {
        setIsLoading(!!value);
        setExposedVariables({
          isLoading: !!value,
        });
      },
      setLinkTarget: async function (value) {
        setLinkTargetState(value);
      },
      setLinkText: async function (value) {
        if (typeof value === 'string') {
          setLinkTextState(value);
        }
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow,
        }}
      >
        <center>
          <Loader width="16" absolute={false} />
        </center>
      </div>
    );
  }
  return (
    <div
      className={cx('link-widget', { 'd-none': !isVisible }, `${underline}`)}
      style={computedStyles}
      data-cy={dataCy}
      ref={wrapperRef}
    >
      <a
        {...(linkTargetState != '' ? { href: linkTargetState } : {})}
        target={targetType === 'new' && '_blank'}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={() => {
          if (isDisabled) return;
          fireEvent('onHover');
        }}
        style={{
          width: '100%',
          textDecorationColor: textColor,
          margin: verticalAlignment === 'top' ? undefined : verticalAlignment === 'center' ? 'auto 0' : 'auto 0 0',
        }}
        ref={clickRef}
        disabled={isDisabled}
      >
        <span
          style={{
            display: 'block',
            fontSize: textSize,
            cursor: 'auto',
            color: textColor,
            paddingBottom: verticalAlignment === 'bottom' ? '1px' : '0px',
          }}
        >
          {iconVisibility && (
            // Inline, so the icon hugs the first line under every alignment. The zero-width space
            // makes the box one text line tall, which centres the icon on that line at any size.
            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px' }}>
              &#8203;
              <TablerIcon
                iconName={icon}
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  minWidth: `${iconSize}px`,
                  minHeight: `${iconSize}px`,
                }}
                stroke={1.5}
              />
            </span>
          )}
          <span
            className="link-text"
            style={{ overflowWrap: 'anywhere', ...(isDisabled && { pointerEvents: 'none' }) }}
          >
            {linkTextState}
          </span>
        </span>
      </a>
    </div>
  );
};

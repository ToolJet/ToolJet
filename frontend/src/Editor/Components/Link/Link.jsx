import React, { useRef, useEffect, useState } from 'react';
import * as Icons from '@tabler/icons-react';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import './link.scss';
const tinycolor = require('tinycolor2');

export const Link = ({ height, properties, styles, fireEvent, setExposedVariables, dataCy }) => {
  const { linkTarget, linkText, targetType, visibility, disabledState, loadingState } = properties;
  const { textColor, textSize, underline, boxShadow, verticalAlignment, horizontalAlignment, icon, iconVisibility } =
    styles;
  const clickRef = useRef();
  const [linkTargetState, setLinkTargetState] = useState(linkTarget);
  const [linkTextState, setLinkTextState] = useState(linkText);
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const [isLoading, setIsLoading] = useState(false);

  const computedStyles = {
    display: 'flex',
    alignItems: verticalAlignment === 'top' ? 'flex-start' : verticalAlignment === 'center' ? 'center' : 'flex-end',
    justifyContent:
      horizontalAlignment === 'left' ? 'flex-start' : horizontalAlignment === 'center' ? 'center' : 'flex-end',
    height: '100%',
    width: '100%',
    boxShadow,
    opacity: isDisabled ? 0.5 : 1,
    pointerEvents: isDisabled ? 'none' : 'auto',
    fontWeight: '500',
    '--link-hover-color': tinycolor(textColor).darken(8).toString(),
  };
  // eslint-disable-next-line import/namespace
  const IconElement = Icons?.[icon] == undefined ? Icons['IconHome2'] : Icons[icon];
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
        setIsVisible(value);
      },
      setDisable: async function (value) {
        setIsDisabled(value);
      },
      setLoading: async function (value) {
        setIsLoading(value);
      },
      setLinkTarget: async function (value) {
        setLinkTargetState(value);
      },
      setLinkText: async function (value) {
        setLinkTextState(value);
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    >
      <a
        {...(linkTargetState != '' ? { href: linkTargetState } : {})}
        target={targetType === 'new' && '_blank'}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={() => {
          fireEvent('onHover');
        }}
        style={{ color: textColor, fontSize: textSize, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
        ref={clickRef}
      >
        <span className="d-flex justify-content-center">
          {iconVisibility && (
            <IconElement
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                minWidth: `${iconSize}px`,
                minHeight: `${iconSize}px`,
                marginRight: '4px',
                marginTop: '2px',
              }}
              stroke={1.5}
            />
          )}
          {linkTextState}
        </span>
      </a>
    </div>
  );
};

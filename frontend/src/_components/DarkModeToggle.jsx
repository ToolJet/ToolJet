import React from 'react';
import { useSpring, animated } from 'react-spring';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';

export const DarkModeToggle = function DarkModeToggle({
  darkMode = false,
  switchDarkMode,
  tooltipPlacement = 'bottom',
  showText = false,
}) {
  const toggleDarkMode = () => {
    switchDarkMode(!darkMode);
  };
  const { t } = useTranslation();
  const properties = {
    sun: {
      r: 9,
      transform: 'rotate(40deg)',
      cx: 12,
      cy: 4,
      opacity: 0,
    },
    moon: {
      r: 5,
      transform: 'rotate(90deg)',
      cx: 30,
      cy: 0,
      opacity: 1,
    },
    springConfig: { mass: 4, tension: 250, friction: 35 },
  };

  const { r, transform, cx, cy, opacity } = properties[darkMode ? 'moon' : 'sun'];

  const svgContainerProps = useSpring({
    transform,
    config: properties.springConfig,
  });
  const centerCircleProps = useSpring({ r, config: properties.springConfig });
  const maskedCircleProps = useSpring({
    cx,
    cy,
    color: 'white',
    config: properties.springConfig,
  });
  const linesProps = useSpring({ opacity, config: properties.springConfig });

  return (
    <OverlayTrigger
      placement={tooltipPlacement}
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Tooltip id="button-tooltip">
          {darkMode
            ? t('header.darkModeToggle.activateLightMode', 'Activate light mode')
            : t('header.darkModeToggle.activateDarkMode', 'Activate dark mode')}
        </Tooltip>
      }
    >
      <div
        className="unstyled-button dark-theme-toggle-btn  sidebar-svg-icon  left-sidebar-item "
        onClick={toggleDarkMode}
      >
        <animated.svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          color={'var(--button-tirtiary-icon)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
          style={{
            cursor: 'pointer',
            ...svgContainerProps,
            transform: 'rotate(315deg)',
          }}
        >
          <mask id="myMask2">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <animated.circle style={maskedCircleProps} r="9" fill="black" />
          </mask>

          <animated.circle
            cx="12"
            cy="12"
            style={centerCircleProps}
            fill={'var(--button-tirtiary-icon)'}
            mask="url(#myMask2)"
          />
          <animated.g stroke="currentColor" style={linesProps}>
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </animated.g>
        </animated.svg>

        {showText && (
          <span className="dark-theme-toggle-btn-text">Switch to {!darkMode ? 'dark mode' : 'light mode'}</span>
        )}
      </div>
    </OverlayTrigger>
  );
};

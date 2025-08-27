import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import { Button } from '@/components/ui/Button/Button';
import { Moon, Sun } from 'lucide-react';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

export const DarkModeToggle = function DarkModeToggle({
  darkMode = false,
  switchDarkMode,
  tooltipPlacement = 'bottom',
  showText = false,
  toggleForCanvas = false,
}) {
  const setResolvedGlobals = useStore((state) => state.setResolvedGlobals, shallow);
  const setGlobalSettings = useStore((state) => state.setGlobalSettings, shallow);
  const globalSettings = useStore((state) => state.globalSettings, shallow);
  const [appLevelDarkMode, setAppLevelDarkMode] = useState(false);

  const { onAppModeChange, appMode } = useAppDarkMode();

  const toggleDarkMode = () => {
    if (toggleForCanvas) {
      const exposedTheme = !appLevelDarkMode ? 'dark' : 'light';
      setResolvedGlobals('theme', { name: exposedTheme });
      setAppLevelDarkMode(!appLevelDarkMode);
      switchDarkMode(!darkMode);
    } else {
      posthogHelper.captureEvent('darkMode', { mode: !darkMode ? 'dark' : 'white' });
      switchDarkMode(!darkMode);
      if (appMode === 'auto') {
        setResolvedGlobals('theme', { name: !darkMode ? 'dark' : 'light' });
      }
    }
  };

  const { t } = useTranslation();

  return (
    <OverlayTrigger
      placement={tooltipPlacement}
      delay={{ show: 250, hide: 400 }}
      trigger={['hover', 'focus']}
      overlay={
        <Tooltip id="button-tooltip">
          {darkMode
            ? t('header.darkModeToggle.activateLightMode', 'Activate light mode')
            : t('header.darkModeToggle.activateDarkMode', 'Activate dark mode')}
        </Tooltip>
      }
    >
      <Button
        className={classnames('left-sidebar-item')}
        onClick={toggleDarkMode}
        variant="ghost"
        size="default"
        iconOnly
      >
        {darkMode ? (
          <Moon width="16" height="16" className="tw-text-icon-strong" />
        ) : (
          <Sun width="16" height="16" className="tw-text-icon-strong" />
        )}
      </Button>
    </OverlayTrigger>
  );
};

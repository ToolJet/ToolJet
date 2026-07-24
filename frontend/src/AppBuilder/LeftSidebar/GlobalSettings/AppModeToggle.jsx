import React from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { useTranslation } from 'react-i18next';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const APP_MODES = [
  { label: 'Auto', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const AppModeToggle = ({ darkMode }) => {
  const { onAppModeChange, appMode } = useAppDarkMode();
  const { t } = useTranslation();

  const setResolvedGlobals = useStore((state) => state.setResolvedGlobals);

  return (
    <div className="canvas-settings-row">
      <span className="canvas-settings-label" data-cy={`label-padding-mode`}>
        {t('leftSidebar.Settings.appMode', 'Padding')}
      </span>
      <div className="canvas-settings-input-wrapper">
        <div className="canvas-toggle-container">
          <ToggleGroup
            onValueChange={(value) => {
              let exposedTheme = value;
              if (value === 'auto') {
                exposedTheme = darkMode ? 'dark' : 'light';
              }
              onAppModeChange({ appMode: value });
              setResolvedGlobals('theme', { name: exposedTheme });
            }}
            defaultValue={appMode}
          >
            {APP_MODES.map((appMode) => (
              <ToggleGroupItem key={appMode.value} value={appMode.value}>
                {appMode.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};

export default AppModeToggle;

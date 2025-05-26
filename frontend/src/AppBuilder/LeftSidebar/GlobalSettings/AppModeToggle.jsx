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
  const { globalSettingsChanged } = useStore(
    (state) => ({
      globalSettingsChanged: state.globalSettingsChanged,
    }),
    shallow
  );
  const setResolvedGlobals = useStore((state) => state.setResolvedGlobals);

  return (
    <div className="d-flex align-items-center mb-3">
      <span data-cy={`label-maintenance-mode`}>{t('leftSidebar.Settings.appMode', 'App mode')}</span>
      <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px', width: '158px' }}>
        <ToggleGroup
          onValueChange={(value) => {
            let exposedTheme = value;
            if (value === 'auto') {
              exposedTheme = darkMode ? 'dark' : 'light';
            }
            onAppModeChange({ appMode: value });
            // globalSettingsChanged({ theme: { name: exposedTheme } });
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
  );
};

export default AppModeToggle;

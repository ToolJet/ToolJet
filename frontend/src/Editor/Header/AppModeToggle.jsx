import React from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { useTranslation } from 'react-i18next';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import { useCurrentStateStore } from '@/_stores/currentStateStore';

const APP_MODES = [
  { label: 'Auto', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const AppModeToggle = () => {
  const { onAppModeChange, appMode } = useAppDarkMode();
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center mb-3">
      <span data-cy={`label-maintenance-mode`}>{t('leftSidebar.Settings.appMode', 'App mode')}</span>
      <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px', width: '158px' }}>
        <ToggleGroup
          onValueChange={(value) => {
            let exposedTheme = value;
            if (value === 'auto') {
              exposedTheme = localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
            }
            useCurrentStateStore.getState().actions.setCurrentState({
              globals: {
                ...useCurrentStateStore.getState().globals,
                theme: { name: exposedTheme },
              },
            });
            onAppModeChange({ appMode: value });
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

import React, { useContext } from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { useTranslation } from 'react-i18next';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import { useSuperStore } from '../../_stores/superStore';
import { ModuleContext } from '../../_contexts/ModuleContext';
// import { ModuleContext } from '../_contexts/ModuleContext';

const APP_MODES = [
  { label: 'Auto', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const AppModeToggle = ({ globalSettingsChanged }) => {
  const moduleName = useContext(ModuleContext);
  const { onAppModeChange, appMode } = useAppDarkMode();
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center mb-3">
      <span data-cy={`label-maintenance-mode`}>{t('leftSidebar.Settings.appMode', 'App mode')}</span>
      <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px', width: '158px' }}>
        <ToggleGroup
          onValueChange={(value) => {
            onAppModeChange(value);
            let exposedTheme = value;
            if (value === 'auto') {
              exposedTheme = localStorage.getItem('darkMode') ? 'dark' : 'light';
            }
            useSuperStore
              .getState()
              .modules[moduleName].useCurrentStateStore.getState()
              .actions.setCurrentState({
                globals: {
                  ...useSuperStore.getState().modules[moduleName].useCurrentStateStore.getState().globals,
                  theme: { name: exposedTheme },
                },
              });
            globalSettingsChanged({ appMode: value });
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

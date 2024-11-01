import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

const useAppDarkMode = () => {
  const { appMode, globalSettingsChanged, isTJDarkMode } = useStore(
    (state) => ({
      appMode: state.globalSettings.appMode,
      globalSettingsChanged: state.globalSettingsChanged,
      isTJDarkMode: state.isTJDarkMode,
    }),
    shallow
  );

  const isAppDarkMode = useMemo(() => {
    if (appMode === 'light') {
      return false;
    } else if (appMode === 'dark') {
      return true;
    } else {
      return localStorage.getItem('darkMode') === 'true';
    }
  }, [appMode, isTJDarkMode]);

  return {
    onAppModeChange: globalSettingsChanged,
    appMode,
    isAppDarkMode,
  };
};

export default useAppDarkMode;

import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

const useAppDarkMode = () => {
  const { appMode, updateAppMode, isTJDarkMode } = useStore(
    (state) => ({
      appMode: state.globalSettings.appMode,
      updateAppMode: state.updateAppMode,
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
    onAppModeChange: updateAppMode,
    appMode,
    isAppDarkMode,
  };
};

export default useAppDarkMode;

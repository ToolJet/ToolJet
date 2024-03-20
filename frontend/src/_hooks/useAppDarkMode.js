import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useEditorStore } from '@/_stores/editorStore';
import { useAppDataStore } from '@/_stores/appDataStore';
import { useCurrentStateStore } from '@/_stores/currentStateStore';

const useAppDarkMode = () => {
  const { appMode, setAppMode } = useEditorStore(
    (state) => ({
      appMode: state.appMode,
      setAppMode: state.actions.setAppMode,
    }),
    shallow
  );

  const { isTJDarkMode } = useAppDataStore(
    (state) => ({
      isTJDarkMode: state.isTJDarkMode,
    }),
    shallow
  );

  const { setTheme } = useCurrentStateStore(
    (state) => ({
      setTheme: state.actions.setTheme,
    }),
    shallow
  );

  const handleAppModeChange = (appMode = 'auto') => {
    setAppMode(appMode);
    setTheme(appMode);
  };

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
    onAppModeChange: handleAppModeChange,
    appMode,
    isAppDarkMode,
  };
};

export default useAppDarkMode;

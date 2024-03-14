import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useEditorStore } from '../../_stores/editorStore';
import { useAppDataStore } from '../../_stores/appDataStore';
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
    let isDarkMode = false;
    if (appMode === 'light') {
      isDarkMode = false;
    } else if (appMode === 'dark') {
      isDarkMode = true;
    } else {
      isDarkMode = localStorage.getItem('darkMode') === 'true';
    }
    return isDarkMode;
  }, [appMode, isTJDarkMode]);

  return {
    onAppModeChange: handleAppModeChange,
    appMode,
    isAppDarkMode,
  };
};

export default useAppDarkMode;

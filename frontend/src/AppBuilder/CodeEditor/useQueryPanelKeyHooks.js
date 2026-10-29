import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import useStore from '@/AppBuilder/_stores/store';
import { useStableCallback } from '@/AppBuilder/_hooks/useStableCallback';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useQueryPanelKeyHooks = (onChange, value, type) => {
  const moduleId = useModuleId();
  const location = useLocation();
  const { pathname } = location;

  // Keybindings end up inside the CodeMirror `extensions` prop, so the array must
  // keep a stable identity (see useStableCallback). Store values are read at
  // keystroke time instead of being subscribed to.
  const runShortcut = useStableCallback((shortcutAction) => {
    const { queryPanelHeight, runQueryOnShortcut, previewQueryOnShortcut } = useStore.getState().queryPanel;
    const isEditor = pathname.includes('/apps/');
    if (queryPanelHeight !== 0 && isEditor) {
      onChange(type === 'multiline' ? value.current : value);
      if (shortcutAction === 'run') {
        runQueryOnShortcut();
      } else {
        previewQueryOnShortcut(moduleId);
      }
    }
    return true;
  });

  const queryPanelKeybindings = useMemo(
    () => [
      {
        key: 'Mod-Enter',
        preventDefault: true,
        run: () => runShortcut('run'),
      },
      {
        key: 'Mod-Shift-Enter',
        preventDefault: true,
        run: () => runShortcut('preview'),
      },
    ],
    [runShortcut]
  );

  return {
    queryPanelKeybindings,
  };
};

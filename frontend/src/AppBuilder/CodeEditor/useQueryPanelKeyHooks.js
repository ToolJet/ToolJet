import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import useStore from '@/AppBuilder/_stores/store';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useQueryPanelKeyHooks = (onChange, value, type) => {
  const queryPanelHeight = useStore((state) => state.queryPanel.queryPanelHeight);
  const runQueryOnShortcut = useStore((state) => state.queryPanel.runQueryOnShortcut);
  const previewQueryOnShortcut = useStore((state) => state.queryPanel.previewQueryOnShortcut);
  const moduleId = useModuleId();
  const location = useLocation();
  const { pathname } = location;

  const [queryPanelKeybindings, setQueryPanelKeybindings] = useState([]);

  const handleRunQuery = useCallback(
    (view) => {
      const isEditor = pathname.includes('/apps/');
      if (queryPanelHeight !== 0 && isEditor) {
        onChange(type === 'multiline' ? value.current : value);
        runQueryOnShortcut();
      }
      return true;
    },
    [queryPanelHeight, onChange, runQueryOnShortcut, value]
  );

  const handlePreviewQuery = useCallback(
    (view) => {
      const isEditor = pathname.includes('/apps/');
      if (queryPanelHeight !== 0 && isEditor) {
        onChange(type === 'multiline' ? value.current : value);
        previewQueryOnShortcut(moduleId);
      }
      return true;
    },
    [queryPanelHeight, moduleId, onChange, previewQueryOnShortcut, value]
  );

  useEffect(() => {
    setQueryPanelKeybindings([
      {
        key: 'Mod-Enter',
        preventDefault: true,
        run: handleRunQuery,
      },
      {
        key: 'Mod-Shift-Enter',
        preventDefault: true,
        run: handlePreviewQuery,
      },
    ]);
  }, [handleRunQuery, handlePreviewQuery]);

  return {
    queryPanelKeybindings,
  };
};

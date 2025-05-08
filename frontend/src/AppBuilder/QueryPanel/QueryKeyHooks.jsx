import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useHotkeys } from 'react-hotkeys-hook';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';

const QueryKeyHooks = ({ children, isExpanded }) => {
  const runQueryOnShortcut = useStore((state) => state.queryPanel.runQueryOnShortcut);
  const previewQueryOnShortcut = useStore((state) => state.queryPanel.previewQueryOnShortcut);
  const moduleId = useModuleId();

  useHotkeys(
    ['mod+enter', 'mod+shift+enter'],
    (event, handler) => {
      if (handler.mod && handler.keys[0] === 'enter') {
        if (handler.shift) {
          previewQueryOnShortcut(moduleId);
        } else runQueryOnShortcut();
      }
    },
    { enabled: isExpanded, enableOnFormTags: ['input'] }
  );

  return <div className="row main-row">{children}</div>;
};

export default QueryKeyHooks;

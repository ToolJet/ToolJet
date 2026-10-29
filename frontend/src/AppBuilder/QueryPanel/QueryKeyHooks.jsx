import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useHotkeys } from 'react-hotkeys-hook';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import { ABORT_UNSUPPORTED_KINDS } from '@/AppBuilder/QueryManager/constants';

const QueryKeyHooks = ({ children, isExpanded }) => {
  const runQueryOnShortcut = useStore((state) => state.queryPanel.runQueryOnShortcut);
  const previewQueryOnShortcut = useStore((state) => state.queryPanel.previewQueryOnShortcut);
  const abortQueryOnShortcut = useStore((state) => state.queryPanel.abortQueryOnShortcut);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const isPreviewQueryLoading = useStore((state) => state.queryPanel.isPreviewQueryLoading);
  const isQueryLoading = useStore(
    (state) => state.resolvedStore.modules.canvas.exposedValues.queries[selectedQuery?.id]?.isLoading ?? false
  );
  const moduleId = useModuleId();

  const isAbortSupported = !ABORT_UNSUPPORTED_KINDS.has(selectedQuery?.kind);
  const isQueryActive = isQueryLoading || isPreviewQueryLoading;

  useHotkeys(
    ['mod+enter', 'mod+shift+enter'],
    (event, handler) => {
      if (handler.mod && handler.keys[0] === 'enter') {
        if (handler.shift) {
          previewQueryOnShortcut(moduleId);
        } else runQueryOnShortcut();
      }
    },
    { enabled: isExpanded && !isQueryActive, enableOnFormTags: ['input'] }
  );

  useHotkeys('mod+period', () => abortQueryOnShortcut(moduleId), {
    enabled: isExpanded && isAbortSupported && isQueryActive,
    enableOnFormTags: ['input'],
  });

  return <div className="row main-row">{children}</div>;
};

export default QueryKeyHooks;

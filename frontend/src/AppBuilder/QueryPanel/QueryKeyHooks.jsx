import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useHotkeys } from 'react-hotkeys-hook';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';

const QueryKeyHooks = ({ children, isExpanded }) => {
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const moduleId = useModuleId();
  const previewQuery = useStore((state) => state.queryPanel.previewQuery);
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const queryName = selectedQuery?.name ?? '';

  const previewButtonOnClick = () => {
    const _options = { ...selectedQuery.options };
    const query = {
      data_source_id: selectedDataSource.id === 'null' ? null : selectedDataSource.id,
      pluginId: selectedDataSource.pluginId,
      options: _options,
      kind: selectedDataSource.kind,
      name: queryName,
      id: selectedQuery?.id,
    };
    previewQuery(query, false, undefined, moduleId).catch(({ error, data }) => {
      console.log(error, data);
    });
  };

  const shortcutRef = useHotkeys(
    ['mod+enter', 'mod+shift+enter'],
    (event, handler) => {
      if (handler.mod && handler.keys[0] === 'enter') {
        if (handler.shift) {
          previewButtonOnClick();
        } else runQuery(selectedQuery?.id, selectedQuery?.name, undefined, 'edit', {}, true);
      }
    },
    { enabled: isExpanded }
  );

  return (
    <div ref={shortcutRef} tabIndex={-1} className="row main-row">
      {children}
    </div>
  );
};

export default QueryKeyHooks;

import React, { useEffect, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import ArrowLeft from '@/_ui/Icon/bulkIcons/Arrowleft';
import CheveronRight from '@/_ui/Icon/bulkIcons/CheveronRight';
import { getTheme } from './utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { TreeViewHeader } from './TreeViewHeader';
import useCallbackActions from './useCallbackActions';
import OverflowTooltip from '@/_components/OverflowTooltip';

export const JSONViewer = (props) => {
  const { data, path, darkMode, backFn } = props;
  const [theme, setTheme] = useState(() => getTheme(darkMode));
  const callbackActions = useCallbackActions() || [];
  const type = path.startsWith('components') ? 'components' : path.startsWith('queries') ? 'queries' : 'actions';
  const nodeSpecificActions = callbackActions.filter((action) => [type].includes(action.for))?.[0]?.actions;
  const optionsData = {
    nodeName: path?.split('.')?.slice(-1)?.[0] || '',
    selectedNodePath: path,
  };

  const generalActions = callbackActions.filter((action) => action.for === 'all')?.[0]?.actions || [];

  useEffect(() => {
    setTheme(() => getTheme(darkMode));
  }, [darkMode]);

  return (
    <div className="json-viewer">
      <TreeViewHeader
        path={path}
        backFn={backFn}
        darkMode={darkMode}
        nodeSpecificActions={nodeSpecificActions}
        generalActions={generalActions}
        data={optionsData}
        type={type}
      />

      <JSONTree
        theme={theme}
        data={data}
        invertTheme={!darkMode}
        collectionLimit={100}
        hideRoot={true}
        labelRenderer={(keyPath) => {
          const key = keyPath[0];
          if (!key && key != 0) return '';
          return key;
        }}
        valueRenderer={(raw, value) => {
          if (typeof value === 'function') {
            return (
              <span className="json-viewer-node-value" style={{ color: '#4368E3' }}>
                function
              </span>
            );
          }

          return <span className="json-viewer-node-value">{raw}</span>;
        }}
      />
    </div>
  );
};

export default JSONViewer;

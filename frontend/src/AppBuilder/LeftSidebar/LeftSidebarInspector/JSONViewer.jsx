import React from 'react';
import { TreeViewHeader } from './TreeViewHeader';
import useCallbackActions from './useCallbackActions';
import CustomJSONViewer from './CustomJSONViewer/CustomJSONViewer';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const JSONViewer = (props) => {
  const { data, path, darkMode, backFn, iconsList } = props;
  const getComponentIdFromName = useStore((state) => state.getComponentIdFromName, shallow);

  const callbackActions = useCallbackActions() || [];
  const type = path.startsWith('components') ? 'components' : path.startsWith('queries') ? 'queries' : 'actions';
  const nodeSpecificActions = callbackActions.filter((action) => [type].includes(action.for))?.[0]?.actions;
  const optionsData = {
    nodeName: path?.split('.')?.slice(-1)?.[0] || '',
    selectedNodePath: path,
  };
  let transformedData = data;

  const generalActions = callbackActions.filter((action) => action.for === 'all')?.[0]?.actions || [];
  if (type === 'components' && transformedData === undefined) {
    transformedData = {
      id: getComponentIdFromName(path?.split('.')?.slice(-1)?.[0] || ''),
    };
  }

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
      <CustomJSONViewer absolutePath={path} data={transformedData} darkMode={darkMode} iconsList={iconsList} />
    </div>
  );
};

export default JSONViewer;

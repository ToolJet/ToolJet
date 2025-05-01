import React from 'react';
import { TreeViewHeader } from './TreeViewHeader';
import useCallbackActions from './useCallbackActions';
import CustomJSONViewer from './CustomJSONViewer/CustomJSONViewer';

export const JSONViewer = (props) => {
  const { data, path, darkMode, backFn } = props;

  const callbackActions = useCallbackActions() || [];
  const type = path.startsWith('components') ? 'components' : path.startsWith('queries') ? 'queries' : 'actions';
  const nodeSpecificActions = callbackActions.filter((action) => [type].includes(action.for))?.[0]?.actions;
  const optionsData = {
    nodeName: path?.split('.')?.slice(-1)?.[0] || '',
    selectedNodePath: path,
  };

  const generalActions = callbackActions.filter((action) => action.for === 'all')?.[0]?.actions || [];

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
      <CustomJSONViewer absolutePath={path} data={data} darkMode={darkMode} />
    </div>
  );
};

export default JSONViewer;

import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { copyToClipboard } from './utils';

const useCallbackActions = () => {
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const currentPageComponents = useStore((state) => state?.getCurrentPageComponents(), shallow);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const getComponentIdToAutoScroll = useStore((state) => state.getComponentIdToAutoScroll);
  const setSelectedQuery = useStore((state) => state.queryPanel.setSelectedQuery, shallow);
  const getComponentIdFromName = useStore((state) => state.getComponentIdFromName, shallow);
  const getQueryIdFromName = useStore((state) => state.getQueryIdFromName, shallow);

  const handleRemoveComponent = (component) => {
    const { nodeName } = component;
    const componentId = getComponentIdFromName(nodeName);
    deleteComponents([componentId]);
  };

  const handleSelectComponentOnEditor = (component) => {
    const { nodeName } = component;
    const componentId = getComponentIdFromName(nodeName);
    if (currentPageComponents?.[componentId]) {
      setSelectedComponents([componentId]);
    }
  };

  const handleRunQuery = (data) => {
    const { nodeName } = data;
    const queryId = getQueryIdFromName(nodeName);
    runQuery(queryId, nodeName, undefined, 'edit', {}, true);
  };

  const selectQuery = (data) => {
    const { nodeName } = data;
    const id = getQueryIdFromName(nodeName);
    setSelectedQuery(id);
  };

  const handleAutoScrollToComponent = (data) => {
    const componentId = getComponentIdFromName(data.nodeName);
    const { isAccessible, computedComponentId, isOnCanvas } = getComponentIdToAutoScroll(componentId);
    if (!isAccessible) {
      if (isOnCanvas) {
        toast.success(
          `This component can't be opened because it's on the main canvas. Close ${computedComponentId} and click "Go to component" to view it there`
        );
      } else
        toast.success(
          `This component can't be opened because it's inside ${computedComponentId}. Open ${computedComponentId} and click "Go to component"to view it.`
        );
      return;
    }
    setSelectedComponents([computedComponentId]);
    const target = document.getElementById(computedComponentId);
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const callbackActions = [
    {
      for: 'queries',
      actions: [
        {
          name: 'Run Query',
          dispatchAction: handleRunQuery,
          icon: true,
          src: 'assets/images/icons/editor/play.svg',
          width: 8,
          height: 8,
          enableInspectorTreeView: false,
        },
        {
          name: 'View query',
          dispatchAction: selectQuery,
          icon: true,
          src: 'assets/images/icons/editor/file-code.svg',
          width: 14,
          height: 14,
          enableInspectorTreeView: true,
        },
      ],
      enableForAllChildren: false,
      enableFor1stLevelChildren: true,
    },
    {
      for: 'components',
      actions: [
        {
          name: 'Select Widget',
          dispatchAction: handleSelectComponentOnEditor,
          icon: false,
          onSelect: true,
          enableInspectorTreeView: false,
        },
        {
          name: 'Go to component',
          dispatchAction: handleAutoScrollToComponent,
          icon: true,
          iconName: 'select',
          enableInspectorTreeView: true,
        },
        ...(!shouldFreeze
          ? [
              {
                name: 'Delete Component',
                dispatchAction: handleRemoveComponent,
                icon: true,
                iconName: 'trash',
                enableInspectorTreeView: false,
              },
            ]
          : []),
      ],
      enableForAllChildren: false,
      enableFor1stLevelChildren: true,
    },
    {
      for: 'all',
      actions: [
        { name: 'Copy value', dispatchAction: copyToClipboard, icon: false, enableInspectorTreeView: true },
        { name: 'Copy path', dispatchAction: copyToClipboard, icon: false, enableInspectorTreeView: true },
      ],
    },
  ];
  return callbackActions;
};

export default useCallbackActions;

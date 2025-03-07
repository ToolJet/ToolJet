import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
// import { runQuery } from '@/AppBuilder/_utils/queryPanel';

const useCallbackActions = () => {
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const currentPageComponents = useStore((state) => state?.getCurrentPageComponents(), shallow);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const getComponentIdToAutoScroll = useStore((state) => state.getComponentIdToAutoScroll);

  const handleRemoveComponent = (component) => {
    deleteComponents([component.id]);
  };

  const handleSelectComponentOnEditor = (component) => {
    if (currentPageComponents?.[component.id]) {
      setSelectedComponents([component.id]);
    }
  };

  const handleRunQuery = (query, currentNode) => {
    runQuery(query.id, currentNode, undefined, 'edit', {}, true);
  };

  const copyToClipboard = (data) => {
    const stringified = JSON.stringify(data, null, 2).replace(/\\/g, '');
    navigator.clipboard.writeText(stringified);
    return toast.success('Copied to the clipboard', { position: 'top-center' });
  };

  const handleAutoScrollToComponent = (data) => {
    const { isAccessible, computedComponentId, isOnCanvas } = getComponentIdToAutoScroll(data.id);
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
        },
      ],
      enableForAllChildren: false,
      enableFor1stLevelChildren: true,
    },
    {
      for: 'components',
      actions: [
        { name: 'Select Widget', dispatchAction: handleSelectComponentOnEditor, icon: false, onSelect: true },
        { name: 'Go to component', dispatchAction: handleAutoScrollToComponent, icon: true, iconName: 'select' },
        ...(!shouldFreeze
          ? [{ name: 'Delete Component', dispatchAction: handleRemoveComponent, icon: true, iconName: 'trash' }]
          : []),
      ],
      enableForAllChildren: false,
      enableFor1stLevelChildren: true,
    },
    {
      for: 'all',
      actions: [{ name: 'Copy value', dispatchAction: copyToClipboard, icon: false }],
    },
  ];
  return callbackActions;
};

export default useCallbackActions;

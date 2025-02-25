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

  const autoScrollTo = (id) => {
    setSelectedComponents([id]);
    const target = document.getElementById(id);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAutoScrollToComponent = (data) => {
    const currentPageComponents = useStore.getState().getCurrentPageComponents();
    const component = currentPageComponents?.[data.id];

    let parentId = component?.component?.parent;
    if (parentId) {
      const regex = /-\d+$/;
      if (regex.test(parentId)) {
        parentId = parentId.replace(regex, ''); // To get parentId without tab index if parent type is Tab
      }
      const parentType = currentPageComponents?.[parentId]?.component?.component;
      if (parentType && (parentType === 'Modal' || parentType === 'Tabs')) {
        autoScrollTo(parentId); // To scroll to parent component if parent type is Modal or Tabs
        return;
      }
    }

    autoScrollTo(data.id);
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

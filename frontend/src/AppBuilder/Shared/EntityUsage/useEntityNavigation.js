import useStore from '@/AppBuilder/_stores/store';

export const NAVIGABLE_KINDS = new Set(['component', 'query', 'variable', 'pageVariable', 'global', 'constant']);

export const KIND_LABELS = {
  component: 'component',
  query: 'query',
  variable: 'variable',
  pageVariable: 'page var',
  global: 'global',
  constant: 'constant',
  page: 'page',
  unknown: 'unknown',
};

// Navigates the builder to a usage entry ({ kind, id, name }): components are
// selected on canvas, queries open in the query panel, variables/globals/constants
// open the left Inspector. Returns true when navigation happened.
const useEntityNavigation = () => {
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const setSelectedQuery = useStore((state) => state.queryPanel.setSelectedQuery);
  const setIsQueryPaneExpanded = useStore((state) => state.queryPanel.setIsQueryPaneExpanded);
  const setSelectedSidebarItem = useStore((state) => state.setSelectedSidebarItem);
  const toggleLeftSidebar = useStore((state) => state.toggleLeftSidebar);
  const setSelectedNodePath = useStore((state) => state.setSelectedNodePath);

  const openLeftInspector = (path) => {
    setSelectedNodePath?.(path);
    setSelectedSidebarItem('inspect');
    toggleLeftSidebar(true);
  };

  const navigateToEntity = (entry) => {
    switch (entry.kind) {
      case 'component': {
        setSelectedComponents([entry.id]);
        document.getElementById(entry.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      case 'query': {
        setSelectedQuery(entry.id);
        setIsQueryPaneExpanded(true);
        return true;
      }
      case 'variable':
        openLeftInspector(`variables.${entry.name}`);
        return true;
      case 'pageVariable':
        openLeftInspector(`page.variables.${entry.name}`);
        return true;
      case 'global':
        openLeftInspector(`globals.${entry.name}`);
        return true;
      case 'constant':
        openLeftInspector(`constants.${entry.name}`);
        return true;
      default:
        return false;
    }
  };

  return navigateToEntity;
};

export default useEntityNavigation;
